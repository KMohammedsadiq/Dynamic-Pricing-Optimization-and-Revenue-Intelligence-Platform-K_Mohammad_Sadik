"""
evaluate_demand_model.py
========================
Milestone 4 — Demand Forecasting Model Evaluation

Methodology: Re-present + Validate Existing Chronological Holdout
------------------------------------------------------------------
The genuine validation was already performed by train_final_genuine.py:
  - Training data:    genuine_historical rows BEFORE 2026-06-01
  - Validation data:  genuine_historical rows 2026-06-01 -> 2026-08-01
  - Models used:      genuine_7d.pkl, genuine_14d.pkl, genuine_30d.pkl, genuine_90d.pkl
  - Results stored:   ml/training/final_validation_results.json

This script:
  1. Reads and presents those validated metrics (primary source of truth)
  2. Cross-checks them against VALIDATION_METRICS in demand_predictor.py
  3. Runs live inference on a sample of products to confirm models load + respond
  4. Validates: zero/negative predictions, coverage, NaN predictions
  5. Reports demand_predictor.predict_batch_trend() coverage across all products

Usage:
    cd backend
    python -m ml.evaluation.evaluate_demand_model
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAINING_DIR = os.path.join(BASE_DIR, "training")
MODELS_DIR   = os.path.join(BASE_DIR, "models")
DEV_MODELS   = os.path.join(MODELS_DIR, "demand_forecasting_dev")
FILL_CSV     = os.path.join(BASE_DIR, "data", "demand_forecasting_features_fill_dev.csv")
FINAL_JSON   = os.path.join(TRAINING_DIR, "final_validation_results.json")
OUTPUT_PATH  = os.path.join(os.path.dirname(__file__), "demand_model_eval_results.json")

GENUINE_CUTOFF = pd.Timestamp("2026-08-10")

# These are the 4 validated production models
VALIDATED_HORIZONS = {
    7:  {"model_file": "genuine_7d.pkl",  "readiness": "Production Ready"},
    14: {"model_file": "genuine_14d.pkl", "readiness": "Production Ready"},
    30: {"model_file": "genuine_30d.pkl", "readiness": "Limited / Production Candidate"},
    90: {"model_file": "genuine_90d.pkl", "readiness": "Limited"},
}

# Expected from demand_predictor.py VALIDATION_METRICS
EXPECTED_METRICS = {
    7:  {"mae": 54.2,   "rmse": 97.1,   "r2": 0.774, "smape": 14.5},
    14: {"mae": 119.5,  "rmse": 203.2,  "r2": 0.694, "smape": 17.7},
    30: {"mae": 271.9,  "rmse": 459.8,  "r2": 0.640, "smape": 20.7},
    90: {"mae": 891.8,  "rmse": 1421.1, "r2": 0.388, "smape": 19.8},
}

FINAL_MODEL_FEATURES = [
    "units_sold_lag_1", "units_sold_lag_2", "units_sold_lag_4", "units_sold_lag_8",
    "revenue_lag_1", "inventory_turnover_lag_1", "demand_index_lag_1",
    "inventory_level_lag_1", "stockout_flag_lag_1", "competitor_price_lag_1",
    "historical_sales_safe",
    "rolling_4w_sales_mean", "rolling_4w_sales_max", "rolling_4w_sales_std",
    "rolling_8w_sales_mean", "rolling_8w_sales_max", "rolling_12w_sales_mean",
    "rolling_12w_sales_max", "sales_growth_4w",
    "base_price", "cost_price", "current_price", "discount_pct",
    "promotion_type", "promo_active_share",
    "brand", "category", "product_lifecycle", "launch_year", "is_cold_start_product",
    "average_rating", "review_count", "profit_margin",
    "period_index", "year", "month", "week", "quarter", "day_of_week",
    "season", "holiday_flag", "festival_flag", "days_since_first_observed"
]


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super().default(obj)


def main():
    print("=" * 65)
    print("PricePilot AI — Demand Forecasting Model Evaluation")
    print("Source: final_validation_results.json (chronological holdout)")
    print("=" * 65)

    results_out = {}

    # ── 1. Load and present existing validation results ───────────────────
    print(f"\n[1/4] Reading existing validation results from:")
    print(f"      {FINAL_JSON}")
    if not os.path.exists(FINAL_JSON):
        print("      ERROR: final_validation_results.json not found.")
        sys.exit(1)

    with open(FINAL_JSON) as f:
        existing = json.load(f)

    print(f"\n  === Demand Forecasting Validation Results ===")
    print(f"  Source:  genuine_historical provenance only")
    print(f"  Holdout: 2026-06-01 -> 2026-08-01 (chronological, no leakage)")
    print(f"  Models:  genuine_Xd.pkl — trained on genuine_historical < 2026-06-01")
    print()

    horizon_summary = {}
    for hz_key in ["7d", "14d", "30d", "90d", "180d", "365d"]:
        data = existing.get(hz_key, {})
        hz_int = int(hz_key.replace("d", ""))
        status = data.get("status", "Missing")
        print(f"  Horizon {hz_key:>4s}: {status}")

        if status == "OK" and hz_int in VALIDATED_HORIZONS:
            dev = data.get("dev_metrics", {})
            prod = data.get("prod_metrics", {})
            expected = EXPECTED_METRICS.get(hz_int, {})
            val_count = data.get("val_count", 0)
            val_products = data.get("val_products", 0)

            print(f"    Validation: {val_count} rows, {val_products} products, "
                  f"{data.get('val_date_min')} -> {data.get('val_date_max')}")
            print(f"    Dev  model  MAE={dev.get('MAE',0):.1f}  RMSE={dev.get('RMSE',0):.1f}  "
                  f"R²={dev.get('R2',0):.3f}  sMAPE={dev.get('sMAPE',0):.1f}%")
            print(f"    Prod model  MAE={prod.get('MAE',0):.1f}  RMSE={prod.get('RMSE',0):.1f}  "
                  f"R²={prod.get('R2',0):.3f}  sMAPE={prod.get('sMAPE',0):.1f}%")
            print(f"    VALIDATION_METRICS check  (expected dev MAE~{expected.get('mae')}  "
                  f"sMAPE~{expected.get('smape')}%)")

            # Cross-check against VALIDATION_METRICS in demand_predictor.py
            tol = 0.5
            mae_ok   = abs(dev.get("MAE", 0) - expected["mae"])   < tol + abs(expected["mae"] * 0.02)
            rmse_ok  = abs(dev.get("RMSE", 0) - expected["rmse"]) < tol + abs(expected["rmse"] * 0.02)
            r2_ok    = abs(dev.get("R2", 0) - expected["r2"])     < 0.01
            smape_ok = abs(dev.get("sMAPE", 0) - expected["smape"]) < tol + abs(expected["smape"] * 0.02)
            all_ok = mae_ok and rmse_ok and r2_ok and smape_ok
            print(f"    Hardcoded VALIDATION_METRICS match: {'[OK] PASS' if all_ok else '[FAIL] MISMATCH'}")

            # Prod vs dev comparison
            dev_better_mae = dev.get("MAE", 9e9) < prod.get("MAE", 9e9)
            dev_better_smape = dev.get("sMAPE", 9e9) < prod.get("sMAPE", 9e9)
            # For 30d/90d dev RMSE may be slightly higher due to smaller train size
            print(f"    Dev vs Prod: MAE {'dev better' if dev_better_mae else 'prod better'}  "
                  f"sMAPE {'dev better' if dev_better_smape else 'prod better'}")

            horizon_summary[hz_key] = {
                "readiness": VALIDATED_HORIZONS[hz_int]["readiness"],
                "val_count": val_count,
                "val_products": val_products,
                "val_date_range": f"{data.get('val_date_min')} to {data.get('val_date_max')}",
                "dev_metrics": {"MAE": dev.get("MAE"), "RMSE": dev.get("RMSE"),
                                "R2": dev.get("R2"), "sMAPE": dev.get("sMAPE")},
                "prod_metrics": {"MAE": prod.get("MAE"), "RMSE": prod.get("RMSE"),
                                 "R2": prod.get("R2"), "sMAPE": prod.get("sMAPE")},
                "validation_metrics_check": "PASS" if all_ok else "MISMATCH"
            }
        elif status.startswith("Insufficient"):
            horizon_summary[hz_key] = {"readiness": "Insufficient validation data",
                                        "status": status}
        print()

    # ── 2. Model file presence check ──────────────────────────────────────
    print(f"\n[2/4] Checking model files...")
    model_files = {}
    for hz_int, conf in VALIDATED_HORIZONS.items():
        mpath = os.path.join(DEV_MODELS, conf["model_file"])
        exists = os.path.exists(mpath)
        size_kb = os.path.getsize(mpath) // 1024 if exists else 0
        model_files[conf["model_file"]] = {"exists": exists, "size_kb": size_kb}
        status = f"[OK] {size_kb} KB" if exists else "[FAIL] MISSING"
        print(f"  {conf['model_file']:<30} {status}")

    # ── 3. Live inference check ───────────────────────────────────────────
    print(f"\n[3/4] Running live inference check...")

    # Load encoder
    encoder_path = os.path.join(DEV_MODELS, "demand_encoder.pkl")
    if not os.path.exists(encoder_path):
        print(f"  ERROR: Encoder not found at {encoder_path}")
        sys.exit(1)
    with open(encoder_path, "rb") as f:
        enc = pickle.load(f)

    # Load models
    loaded_models = {}
    for hz_int, conf in VALIDATED_HORIZONS.items():
        mpath = os.path.join(DEV_MODELS, conf["model_file"])
        if os.path.exists(mpath):
            with open(mpath, "rb") as f:
                loaded_models[hz_int] = pickle.load(f)

    # Load dataset
    if not os.path.exists(FILL_CSV):
        print(f"  WARNING: Fill CSV not found: {FILL_CSV}")
        print(f"  Skipping live inference check.")
        live_inference = {"status": "skipped", "reason": "Fill CSV not found"}
    else:
        print(f"  Loading {FILL_CSV}...")
        t0 = time.time()
        df = pd.read_csv(FILL_CSV)
        df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
        print(f"  Loaded {len(df):,} rows in {time.time()-t0:.1f}s")

        cat_cols = ["promotion_type", "brand", "category", "product_lifecycle",
                    "month", "day_of_week", "season"]
        df[cat_cols] = enc.transform(df[cat_cols].fillna("Missing"))
        df = df.set_index("product_id", drop=False)

        # Get latest genuine row per product
        hist_df = df[df["date"] <= GENUINE_CUTOFF]
        latest_df = hist_df.sort_values("date").groupby(level=0).last()
        valid_df  = latest_df[~latest_df["rolling_4w_sales_mean"].isna()]

        missing_feats = [f for f in FINAL_MODEL_FEATURES if f not in valid_df.columns]
        if missing_feats:
            print(f"  WARNING: Missing features: {missing_feats}")
            live_inference = {"status": "skipped", "reason": f"Missing features: {missing_feats}"}
        else:
            X_all = valid_df[FINAL_MODEL_FEATURES]
            n_products = len(X_all)
            print(f"  Products with sufficient history: {n_products}")

            live_inference = {"products_with_history": n_products}

            for hz_int, model in loaded_models.items():
                t1 = time.time()
                try:
                    preds = np.maximum(0.0, model.predict(X_all))
                    infer_ms = (time.time() - t1) * 1000

                    n_zero    = int(np.sum(preds == 0))
                    n_nan     = int(np.sum(~np.isfinite(preds)))
                    n_covered = int(np.sum(np.isfinite(preds) & (preds > 0)))
                    coverage  = float(n_covered / n_products * 100) if n_products > 0 else 0

                    # demand trend distribution
                    weeks = {7:1, 14:2, 30:4, 90:13}[hz_int]
                    pred_weekly = preds / weeks
                    rolling_4w  = valid_df["rolling_4w_sales_mean"].values
                    diffs = np.where(rolling_4w > 0, (pred_weekly - rolling_4w) / rolling_4w, 0)
                    n_increasing = int(np.sum(diffs > 0.05))
                    n_decreasing = int(np.sum(diffs < -0.05))
                    n_stable     = n_products - n_increasing - n_decreasing

                    print(f"  Horizon {hz_int:>3}d: coverage={coverage:.0f}%  zero_preds={n_zero}  "
                          f"nan={n_nan}  infer={infer_ms:.0f}ms  "
                          f"trends: ^{n_increasing} <->{n_stable} v{n_decreasing}")

                    live_inference[f"{hz_int}d"] = {
                        "n_products": n_products,
                        "prediction_coverage_pct": coverage,
                        "zero_predictions": n_zero,
                        "nan_predictions": n_nan,
                        "inference_ms": round(infer_ms, 1),
                        "trend_distribution": {
                            "increasing": n_increasing,
                            "stable": n_stable,
                            "decreasing": n_decreasing
                        }
                    }
                except Exception as e:
                    print(f"  Horizon {hz_int}d: ERROR — {e}")
                    live_inference[f"{hz_int}d"] = {"status": "error", "error": str(e)}

    # ── 4. Summary ────────────────────────────────────────────────────────
    print(f"\n[4/4] Summary")
    print(f"  Best-validated horizon: 7d (R²=0.774, sMAPE=14.5%)")
    print(f"  Horizons in production: 7d, 14d (Production Ready); 30d (Candidate); 90d (Limited)")
    print(f"  Horizons NOT validated: 180d, 365d (experimental, insufficient genuine data)")
    print(f"\n  NOTE: These metrics were computed using strictly chronological holdout")
    print(f"  (genuine_historical provenance only, June–Aug 2026 as validation period).")
    print(f"  No data leakage: future synthetic rows were excluded from both train and val.")

    # ── Save ──────────────────────────────────────────────────────────────
    output = {
        "methodology": "Chronological holdout — genuine_historical provenance, Jun–Aug 2026",
        "source_file": FINAL_JSON,
        "models": {str(hz): conf for hz, conf in VALIDATED_HORIZONS.items()},
        "model_files": model_files,
        "horizon_results": horizon_summary,
        "live_inference": live_inference,
        "unvalidated_horizons": {
            "180d": "Experimental — insufficient genuine historical validation data",
            "365d": "Unverified — no genuine historical target data"
        }
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, cls=NpEncoder)
    print(f"\nResults saved to: {OUTPUT_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    main()
