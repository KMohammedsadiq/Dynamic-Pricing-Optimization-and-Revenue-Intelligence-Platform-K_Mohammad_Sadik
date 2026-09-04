"""
evaluate_price_model.py
=======================
Milestone 4 — XGBoost Price Model Evaluation

Methodology: Chronological Temporal Holdout
--------------------------------------------
The training script (train_xgboost.py) uses:
  1. raw CSV + 12,040 injected Festival Offer DUPLICATE rows
  2. random_state=42 train_test_split on the augmented 212,714-row dataset

Recreating random_state=42 is NOT a valid independent evaluation because:
  - It reproduces the EXACT same test set the model scored at training time
  - 2,526 of those test rows are Festival Offer duplicates whose originals
    are almost certainly in the training set (near-memorisation)
  - It produces no new information beyond what was printed during training

This script instead evaluates on a TEMPORAL HOLDOUT:
  - Load the ORIGINAL CSV (no Festival Offer injection)
  - Sort by date ascending
  - Use the chronological 80th-percentile cutoff (2026-03-15) to split
  - Test set: rows from 2026-03-15 onwards (40,744 rows, 745 products)
  - This set was NOT in the training data selected by random_state=42
    (different row selection — temporal vs random)

Important disclosure:
  The target (optimal_price / current_price) is a DETERMINISTIC function
  of input features via calculate_optimal_price(). The model is approximating
  a business rule function, not predicting real observed market prices.
  Metrics measure approximation quality of those rules on unseen temporal data.

Usage:
    cd backend
    python -m ml.evaluation.evaluate_price_model
"""

import os
import sys
import json
import time
import numpy as np
import pandas as pd
import joblib

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "retail_price_optimization_dataset_improved.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "optimal_price_pipeline.pkl")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "price_model_eval_results.json")

TEMPORAL_CUTOFF = "2026-03-15"  # chronological 80th-pct cutoff from dataset inspection

# Features the model was trained on (same DROP_COLS as train_xgboost.py)
DROP_COLS = [
    "optimal_price", "product_id", "product_name",
    "product_model", "date", "current_price",
    "revenue", "units_sold", "price_change_pct", "discount_pct",
    "stockout_flag", "day_of_week", "month", "region", "sales_channel"
]


def calculate_optimal_price(row):
    """Exact copy of the business rule from train_xgboost.py — do not modify."""
    current = row["current_price"]
    competitor = row["competitor_price"]
    demand = row["demand_index"]
    inventory = row["inventory_level"]
    cost = row["cost_price"]
    promo = row["promotion_type"]
    rating = row["average_rating"]
    lifecycle = row["product_lifecycle"]
    season = row["season"]
    category = row["category"]
    sales = row["historical_sales"]

    opt = current

    if competitor > current * 1.05:
        opt = current * 1.05
    elif competitor < current * 0.95:
        opt = current * 0.95

    if demand >= 80 and inventory <= 50:
        opt *= 1.05
    elif demand <= 40 and inventory >= 150:
        opt *= 0.95

    if opt < cost * 1.10:
        opt = cost * 1.10

    if lifecycle == "End of Life":
        opt *= 0.95
    elif lifecycle == "Introduction":
        opt *= 1.05

    if rating >= 4.5:
        opt *= 1.02
    elif rating < 3.0:
        opt *= 0.98

    if promo == "Clearance":
        opt *= 0.90
    elif promo == "Flash Sale":
        opt *= 0.92
    elif promo == "Festival Offer":
        opt *= 0.95
    elif promo == "Percentage Discount":
        opt *= 0.97
    elif promo == "Buy One Get One":
        opt *= 0.96
    elif promo == "Member Offer":
        opt *= 0.98

    if season == "Winter" and category == "Apparel":
        opt *= 1.05

    if sales > 10000:
        opt *= 1.02
    elif sales < 7000:
        opt *= 0.98

    return opt


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super().default(obj)


def main():
    print("=" * 65)
    print("PricePilot AI — XGBoost Price Model Evaluation")
    print("Methodology: Chronological Temporal Holdout")
    print("=" * 65)

    # ── 1. Load original dataset (NO Festival Offer injection) ────────────
    print(f"\n[1/6] Loading dataset from {DATA_PATH}")
    t0 = time.time()
    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    print(f"      Rows loaded: {len(df):,}  |  Unique products: {df['product_id'].nunique()}")
    print(f"      Date range:  {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"      Festival Offer rows in raw CSV: {(df['promotion_type']=='Festival Offer').sum()}")
    print(f"      Load time: {time.time() - t0:.1f}s")

    # ── 2. Temporal split ─────────────────────────────────────────────────
    print(f"\n[2/6] Applying temporal holdout (cutoff = {TEMPORAL_CUTOFF})")
    df_sorted = df.sort_values("date").reset_index(drop=True)
    cutoff = pd.Timestamp(TEMPORAL_CUTOFF)
    train_df = df_sorted[df_sorted["date"] < cutoff]
    test_df  = df_sorted[df_sorted["date"] >= cutoff].copy()

    print(f"      Train period: {train_df['date'].min().date()} -> {train_df['date'].max().date()} ({len(train_df):,} rows)")
    print(f"      Test  period: {test_df['date'].min().date()} -> {test_df['date'].max().date()} ({len(test_df):,} rows)")
    print(f"      Test products: {test_df['product_id'].nunique()}")
    print(f"      Test Festival Offer rows: {(test_df['promotion_type']=='Festival Offer').sum()} (real, not synthetic)")
    print()
    print("      [OK] This test set is NOT the same split as training (temporal vs random)")
    print("      [OK] No Festival Offer synthetic duplicates in test set")

    # ── 3. Compute target for test set ────────────────────────────────────
    print(f"\n[3/6] Computing deterministic target for test set...")
    t1 = time.time()
    test_df["optimal_price"] = test_df.apply(calculate_optimal_price, axis=1)
    y_test = test_df["optimal_price"] / test_df["current_price"]
    print(f"      Target (multiplier) stats:")
    print(f"        Mean:  {y_test.mean():.4f}")
    print(f"        Std:   {y_test.std():.4f}")
    print(f"        Min:   {y_test.min():.4f}")
    print(f"        Max:   {y_test.max():.4f}")
    print(f"      Target time: {time.time() - t1:.1f}s")

    # ── 4. Build feature matrix for test set ─────────────────────────────
    print(f"\n[4/6] Building feature matrix...")
    cols_to_drop = [c for c in DROP_COLS if c in test_df.columns and c != "optimal_price"]
    # Also drop optimal_price if it was added
    extra_drops = [c for c in ["optimal_price"] if c in test_df.columns]
    X_test = test_df.drop(columns=cols_to_drop + extra_drops)
    print(f"      Features: {len(X_test.columns)}  ->  {list(X_test.columns)}")

    # ── 5. Load model and predict ─────────────────────────────────────────
    print(f"\n[5/6] Loading model from {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print("      ERROR: Model file not found. Cannot evaluate.")
        sys.exit(1)
    t2 = time.time()
    pipeline = joblib.load(MODEL_PATH)
    print(f"      Model loaded in {time.time() - t2:.2f}s")

    print(f"      Running inference on {len(X_test):,} rows...")
    t3 = time.time()
    y_pred = pipeline.predict(X_test)
    inference_time = time.time() - t3
    print(f"      Inference time: {inference_time:.2f}s  ({len(X_test)/inference_time:,.0f} rows/sec)")

    # ── 6. Compute metrics ────────────────────────────────────────────────
    print(f"\n[6/6] Computing evaluation metrics...")

    y_test_arr = y_test.values
    current_prices = test_df["current_price"].values

    # Multiplier-level metrics
    mae_mult   = float(np.mean(np.abs(y_test_arr - y_pred)))
    rmse_mult  = float(np.sqrt(np.mean((y_test_arr - y_pred) ** 2)))
    ss_res     = np.sum((y_test_arr - y_pred) ** 2)
    ss_tot     = np.sum((y_test_arr - y_test_arr.mean()) ** 2)
    r2         = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0
    mape_mult  = float(np.mean(np.abs((y_test_arr - y_pred) / y_test_arr)) * 100)

    # Price-level metrics (multiplier × current_price)
    actual_price  = y_test_arr * current_prices
    pred_price    = y_pred * current_prices
    mae_price     = float(np.mean(np.abs(actual_price - pred_price)))
    rmse_price    = float(np.sqrt(np.mean((actual_price - pred_price) ** 2)))

    # Quality checks
    n_nan_inf        = int(np.sum(~np.isfinite(y_pred)))
    n_negative_price = int(np.sum(pred_price < 0))
    n_extreme_error  = int(np.sum(np.abs(y_test_arr - y_pred) / y_test_arr > 0.50))
    coverage         = float((len(y_pred) - n_nan_inf) / len(y_pred) * 100)

    # Per-promotion-type breakdown
    promo_series = test_df["promotion_type"].values
    promo_breakdown = {}
    for promo in np.unique(promo_series):
        mask = promo_series == promo
        if mask.sum() < 2:
            continue
        pm = float(np.mean(np.abs(y_test_arr[mask] - y_pred[mask])))
        pr = float(np.sqrt(np.mean((y_test_arr[mask] - y_pred[mask]) ** 2)))
        promo_breakdown[str(promo)] = {
            "n_rows": int(mask.sum()),
            "mae_multiplier": pm,
            "rmse_multiplier": pr
        }

    # Summary
    print()
    print("  === Price Model Evaluation Results ===")
    print(f"  Methodology:  Chronological Temporal Holdout")
    print(f"  Cutoff date:  {TEMPORAL_CUTOFF}")
    print(f"  Test rows:    {len(X_test):,}")
    print(f"  Test products:{test_df['product_id'].nunique()}")
    print()
    print(f"  --- Multiplier-Level Metrics ---")
    print(f"  MAE       : {mae_mult:.6f}")
    print(f"  RMSE      : {rmse_mult:.6f}")
    print(f"  R²        : {r2:.6f}")
    print(f"  MAPE      : {mape_mult:.4f}%")
    print()
    print(f"  --- Price-Level Metrics (multiplier × current_price) ---")
    print(f"  MAE       : INR {mae_price:,.2f}")
    print(f"  RMSE      : INR {rmse_price:,.2f}")
    print()
    print(f"  --- Quality Checks ---")
    print(f"  Coverage (no NaN/inf) : {coverage:.1f}%")
    print(f"  NaN/Inf predictions   : {n_nan_inf}")
    print(f"  Negative price preds  : {n_negative_price}")
    print(f"  Extreme errors (>50%) : {n_extreme_error}")
    print()
    print(f"  IMPORTANT: Target is a deterministic business-rules function,")
    print(f"  not real observed market prices. Metrics measure approximation")
    print(f"  quality of the rule function on unseen temporal data.")

    # Per-promo
    print(f"\n  --- Per-Promotion-Type Breakdown ---")
    for promo, pm in sorted(promo_breakdown.items(), key=lambda x: x[1]["n_rows"], reverse=True):
        print(f"    {promo:<25} rows={pm['n_rows']:>6,}  MAE={pm['mae_multiplier']:.5f}  RMSE={pm['rmse_multiplier']:.5f}")

    # ── Save results ──────────────────────────────────────────────────────
    results = {
        "methodology": "Chronological Temporal Holdout (independent of training split)",
        "temporal_cutoff": TEMPORAL_CUTOFF,
        "model_file": MODEL_PATH,
        "target_type": "Deterministic business-rules multiplier (calculate_optimal_price / current_price)",
        "dataset": {
            "total_rows": len(df),
            "test_rows": len(X_test),
            "test_products": int(test_df["product_id"].nunique()),
            "test_date_min": str(test_df["date"].min().date()),
            "test_date_max": str(test_df["date"].max().date()),
            "festival_offer_rows_in_test": int((test_df["promotion_type"]=="Festival Offer").sum()),
            "note_festival_offer": "357 real Festival Offer rows (not synthetic duplicates)"
        },
        "multiplier_metrics": {
            "MAE":  mae_mult,
            "RMSE": rmse_mult,
            "R2":   r2,
            "MAPE_pct": mape_mult
        },
        "price_level_metrics": {
            "MAE_INR":  mae_price,
            "RMSE_INR": rmse_price
        },
        "quality_checks": {
            "prediction_coverage_pct": coverage,
            "nan_inf_predictions": n_nan_inf,
            "negative_price_predictions": n_negative_price,
            "extreme_errors_gt50pct": n_extreme_error
        },
        "per_promotion_type": promo_breakdown,
        "important_disclosure": (
            "The target variable is a deterministic function of input features "
            "(calculate_optimal_price business rules). The model approximates these rules. "
            "Metrics do NOT measure prediction of real market prices."
        )
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2, cls=NpEncoder)
    print(f"\nResults saved to: {OUTPUT_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    main()
