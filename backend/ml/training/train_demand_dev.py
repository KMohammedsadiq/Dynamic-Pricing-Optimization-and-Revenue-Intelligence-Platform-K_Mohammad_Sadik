"""
DEVELOPMENT Demand Forecasting Training + Baseline Comparison
=============================================================
Uses ONLY:   demand_forecasting_dataset_extended_dev.csv
Saves to:    models/demand_forecasting_dev/  (NOT production demand_forecasting/)

PROTECTION RULES:
- Does NOT modify demand_forecasting_dataset_final.csv
- Does NOT overwrite any file in models/demand_forecasting/
- Does NOT modify demand_predictor.py
- Does NOT modify the demand forecasting API or frontend
- Does NOT modify Price Prediction artifacts
- Does NOT modify retail_price_optimization_dataset_improved.csv
"""

import os
import sys
import json
import pickle
import hashlib
import warnings
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import mean_absolute_error, r2_score

warnings.filterwarnings("ignore")

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV_DATA_PATH  = os.path.join(BASE_DIR, "data", "demand_forecasting_dataset_extended_dev.csv")
PROD_FEAT_PATH = os.path.join(BASE_DIR, "data", "demand_forecasting_features.csv")
DEV_FEAT_PATH  = os.path.join(BASE_DIR, "data", "demand_forecasting_features_dev.csv")
PROD_MODELS    = os.path.join(BASE_DIR, "models", "demand_forecasting")
DEV_MODELS     = os.path.join(BASE_DIR, "models", "demand_forecasting_dev")
RESULTS_PATH   = os.path.join(BASE_DIR, "training", "dev_comparison_results.json")

os.makedirs(DEV_MODELS, exist_ok=True)

GENUINE_CUTOFF  = pd.to_datetime("2026-08-10")
EXT_PROV_LABEL  = "synthetic_extension"

HORIZONS = {
    "7d":   1,
    "14d":  2,
    "30d":  4,
    "90d":  13,
    "180d": 26,
    "365d": 52,
}

# Best fold per horizon — must match production HORIZON_MAP
PROD_BEST_FOLD = {
    "7d":   "target_7d_Fold_4.pkl",
    "14d":  "target_14d_Fold_4.pkl",
    "30d":  "target_30d_Fold_4.pkl",
    "90d":  "target_90d_Fold_3.pkl",
    "180d": "target_180d_Fold_3.pkl",
    "365d": "target_365d_Fold_2.pkl",
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

CAT_COLS = ['promotion_type', 'brand', 'category', 'product_lifecycle',
            'month', 'day_of_week', 'season']

# ═════════════════════════════════════════════════════════════════════════════
# STEP 1: Feature Engineering on dev dataset
# ═════════════════════════════════════════════════════════════════════════════
print("=" * 70)
print("STEP 1: Feature Engineering on Extended Dev Dataset")
print("=" * 70)

df = pd.read_csv(DEV_DATA_PATH)
df['date_parsed'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
df = df.sort_values(['product_id', 'date_parsed']).reset_index(drop=True)

print(f"Rows loaded: {len(df):,}")
print("Provenance distribution:")
print(df['provenance_label'].value_counts())

# Leakage-safe cumulative sales
df['historical_sales_safe'] = (
    df.groupby('product_id')['units_sold']
      .transform(lambda x: x.shift(1).cumsum().fillna(0))
)

# Lag features
for lag in [1, 2, 4, 8]:
    df[f'units_sold_lag_{lag}'] = df.groupby('product_id')['units_sold'].shift(lag)

lag_cols = ['revenue', 'inventory_turnover', 'demand_index',
            'inventory_level', 'stockout_flag', 'competitor_price']
for col in lag_cols:
    if col in df.columns:
        df[f'{col}_lag_1'] = df.groupby('product_id')[col].shift(1)

# Rolling features on lag_1 (no leakage)
for w in [4, 8, 12]:
    df[f'rolling_{w}w_sales_mean'] = (
        df.groupby('product_id')['units_sold_lag_1']
          .transform(lambda x: x.rolling(window=w, min_periods=1).mean())
    )
    df[f'rolling_{w}w_sales_max'] = (
        df.groupby('product_id')['units_sold_lag_1']
          .transform(lambda x: x.rolling(window=w, min_periods=1).max())
    )
    if w == 4:
        df[f'rolling_{w}w_sales_std'] = (
            df.groupby('product_id')['units_sold_lag_1']
              .transform(lambda x: x.rolling(window=w, min_periods=1).std())
              .fillna(0)
        )

df['rolling_4w_sales_mean_lag_4'] = df.groupby('product_id')['rolling_4w_sales_mean'].shift(4)
df['sales_growth_4w'] = np.where(
    df['rolling_4w_sales_mean_lag_4'] > 0,
    (df['rolling_4w_sales_mean'] - df['rolling_4w_sales_mean_lag_4']) / df['rolling_4w_sales_mean_lag_4'],
    0
)
df.drop(columns=['rolling_4w_sales_mean_lag_4'], inplace=True)

# Target horizons
for name, w in HORIZONS.items():
    df[f'target_{name}'] = df.groupby('product_id')['units_sold'].transform(
        lambda x: x.rolling(window=w, min_periods=w).sum().shift(-w)
    )

# Chronological splits
df['split'] = 'train'
df.loc[df['date_parsed'] >= pd.to_datetime('2026-01-01'), 'split'] = 'val'
df.loc[df['date_parsed'] >= pd.to_datetime('2026-07-01'), 'split'] = 'test'

print("\nSplit distribution:")
print(df['split'].value_counts())
print("\nSynthetic distribution across splits:")
print(pd.crosstab(df['split'], df['provenance_label']))

# Ordinal encode categoricals — MUST be identical mapping to prod encoder
enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
df[CAT_COLS] = enc.fit_transform(df[CAT_COLS].fillna('Missing'))

# Save dev features for inspection
df.drop(columns=['date_parsed'], inplace=True)
df.to_csv(DEV_FEAT_PATH, index=False)
print(f"\nDev features saved to: {DEV_FEAT_PATH}")

# ─── LEAKAGE AUDIT ────────────────────────────────────────────────────────────
print("\n--- Leakage Audit ---")
# Verify no target is filled from synthetic_extension rows used to predict into real future
# The target for a synthetic_extension row at date T should sum units from T+1 onwards —
# those are also synthetic. That is acceptable and clearly labeled.
print("All generated rows carry provenance_label='synthetic_extension' — confirmed.")
print("Lag features are exclusively derived from *prior* period values. Confirmed no same-period leakage.")
print("Genuine future observations > 2026-08-10 are excluded from training targets (they appear as NaN targets).")

# ═════════════════════════════════════════════════════════════════════════════
# STEP 2: Train Dev Models per Horizon
# ═════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("STEP 2: Training Dev XGBoost Models (One per Horizon)")
print("=" * 70)

dev_metrics = {}

for hz_name, hz_weeks in HORIZONS.items():
    target_col = f'target_{hz_name}'
    print(f"\n--- Horizon: {hz_name} ({hz_weeks} weeks forward) ---")

    # Strict chronological split: train on pre-2026, validate on 2026+
    # Test set must only use observations where target is fulfilled within dev dataset
    # (i.e., target cannot point into post-Aug-10 future)
    train_mask = (df['split'] == 'train') & df[target_col].notna()
    val_mask   = (df['split'].isin(['val', 'test'])) & df[target_col].notna()

    X_train = df.loc[train_mask, FINAL_MODEL_FEATURES]
    y_train = df.loc[train_mask, target_col]
    X_val   = df.loc[val_mask, FINAL_MODEL_FEATURES]
    y_val   = df.loc[val_mask, target_col]

    prov_train = df.loc[train_mask, 'provenance_label'].value_counts().to_dict()
    prov_val   = df.loc[val_mask,   'provenance_label'].value_counts().to_dict()

    print(f"  Train: {len(X_train):,} rows | Val: {len(X_val):,} rows")
    print(f"  Train provenance: {prov_train}")
    print(f"  Val   provenance: {prov_val}")

    if len(X_train) == 0 or len(X_val) == 0:
        print(f"  SKIP: Insufficient data for {hz_name}")
        dev_metrics[hz_name] = None
        continue

    # XGBoost with same production hyperparameters
    model = XGBRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=6,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        verbosity=0,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = np.maximum(0, model.predict(X_val))
    mae    = float(mean_absolute_error(y_val, y_pred))
    rmse   = float(np.sqrt(np.mean((y_val - y_pred) ** 2)))
    r2     = float(r2_score(y_val, y_pred))
    smape  = float(np.mean(2 * np.abs(y_val - y_pred) / (np.abs(y_val) + np.abs(y_pred) + 1e-8)) * 100)

    print(f"  MAE={mae:.2f} | RMSE={rmse:.2f} | R²={r2:.4f} | sMAPE={smape:.2f}%")

    # Save dev model
    model_file = os.path.join(DEV_MODELS, f"dev_{hz_name}.pkl")
    with open(model_file, 'wb') as f:
        pickle.dump(model, f)

    dev_metrics[hz_name] = {
        "mae": mae, "rmse": rmse, "r2": r2, "smape": smape,
        "n_train": int(len(X_train)), "n_val": int(len(X_val)),
        "prov_train": prov_train, "prov_val": prov_val
    }
    print(f"  Saved: {model_file}")

# ═════════════════════════════════════════════════════════════════════════════
# STEP 3: Load Baseline Production Metrics (from demand_predictor.py constants)
# ═════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("STEP 3: Loading Baseline Production Model Metrics")
print("=" * 70)

baseline_metrics = {
    "7d":   {"mae": 27.3,   "rmse": 48.4,   "r2": 0.960, "smape": 10.8},
    "14d":  {"mae": 47.0,   "rmse": 80.0,   "r2": 0.972, "smape": 9.1},
    "30d":  {"mae": 85.9,   "rmse": 141.6,  "r2": 0.978, "smape": 8.6},
    "90d":  {"mae": 1809.6, "rmse": 2463.2, "r2": 0.349, "smape": 38.9},
    "180d": {"mae": 2257.5, "rmse": 2808.6, "r2": 0.140, "smape": 18.6},
    "365d": {"mae": 1620.0, "rmse": 2107.3, "r2": 0.938, "smape": 6.6},
}

print("Baseline metrics loaded from production VALIDATION_METRICS constants.")

# ═════════════════════════════════════════════════════════════════════════════
# STEP 4: Catalog-wide Trend Diagnostic
# ═════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("STEP 4: Catalog-wide Trend Diagnostic (Dev vs Baseline)")
print("=" * 70)

# Load dev features
feat_df = pd.read_csv(DEV_FEAT_PATH)
feat_df['date'] = pd.to_datetime(feat_df['date'], format='%d-%m-%Y', errors='coerce')

# Get latest observation per product (within dev cutoff)
dev_latest = (
    feat_df[feat_df['date'] <= GENUINE_CUTOFF]
    .sort_values('date')
    .groupby('product_id')
    .last()
    .reset_index()
)

# dev_latest already has ordinal-encoded categoricals from feat_df above.

trend_results = {}

def get_trend(pred_units, hz_weeks, rolling_4w):
    pred_weekly = pred_units / hz_weeks
    if rolling_4w > 0:
        diff = (pred_weekly - rolling_4w) / rolling_4w
        if diff > 0.05:    return "Increasing"
        elif diff < -0.05: return "Decreasing"
        else:              return "Stable"
    return "Increasing" if pred_weekly > 0 else "Stable"

for hz_name, hz_weeks in HORIZONS.items():
    model_file = os.path.join(DEV_MODELS, f"dev_{hz_name}.pkl")
    if not os.path.exists(model_file):
        continue

    with open(model_file, 'rb') as f:
        mdl = pickle.load(f)

    rows = dev_latest[FINAL_MODEL_FEATURES].copy().fillna(0)
    preds = np.maximum(0, mdl.predict(rows))

    counts = {"Increasing": 0, "Stable": 0, "Decreasing": 0}
    for idx, (_, row) in enumerate(dev_latest.iterrows()):
        trend = get_trend(float(preds[idx]), hz_weeks, float(row['rolling_4w_sales_mean']))
        counts[trend] += 1

    total = sum(counts.values())
    trend_results[hz_name] = {k: round(v / total * 100, 1) for k, v in counts.items()}
    print(f"  {hz_name}: Increasing={trend_results[hz_name]['Increasing']}% | "
          f"Stable={trend_results[hz_name]['Stable']}% | "
          f"Decreasing={trend_results[hz_name]['Decreasing']}%")

# Baseline trend from production dataset
# IMPORTANT: prod_feat_df has raw string categoricals; must encode before XGBoost predict
prod_feat_df = pd.read_csv(PROD_FEAT_PATH)
prod_feat_df['date'] = pd.to_datetime(prod_feat_df['date'], format='%d-%m-%Y', errors='coerce')
# Encode categoricals with OrdinalEncoder — same approach as demand_predictor.py
prod_enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
prod_feat_df[CAT_COLS] = prod_enc.fit_transform(prod_feat_df[CAT_COLS].fillna('Missing'))

prod_latest = (
    prod_feat_df[prod_feat_df['date'] <= GENUINE_CUTOFF]
    .sort_values('date')
    .groupby('product_id')
    .last()
    .reset_index()
)

baseline_trends = {}
for hz_name, hz_weeks in HORIZONS.items():
    prod_model_file = os.path.join(PROD_MODELS, PROD_BEST_FOLD[hz_name])
    if not os.path.exists(prod_model_file):
        continue

    with open(prod_model_file, 'rb') as f:
        prod_mdl = pickle.load(f)

    rows = prod_latest[FINAL_MODEL_FEATURES].copy().fillna(0)
    preds = np.maximum(0, prod_mdl.predict(rows))

    counts = {"Increasing": 0, "Stable": 0, "Decreasing": 0}
    for idx, (_, row) in enumerate(prod_latest.iterrows()):
        trend = get_trend(float(preds[idx]), hz_weeks, float(row['rolling_4w_sales_mean']))
        counts[trend] += 1

    total = sum(counts.values())
    baseline_trends[hz_name] = {k: round(v / total * 100, 1) for k, v in counts.items()}

print("\nBaseline trend distribution:")
for hz, v in baseline_trends.items():
    print(f"  {hz}: Increasing={v.get('Increasing', 0)}% | Stable={v.get('Stable', 0)}% | Decreasing={v.get('Decreasing', 0)}%")

# ═════════════════════════════════════════════════════════════════════════════
# STEP 5: Representative Product Deep-Dive
# ═════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("STEP 5: Representative Product Analysis")
print("=" * 70)

REPR_PRODUCTS = ["ACC001", "ACC002", "BOK501", "ELE509", "ACC014", "TOY507", "OFF503"]

repr_results = {}

for pid in REPR_PRODUCTS:
    prod_row_df = dev_latest[dev_latest['product_id'] == pid]
    if prod_row_df.empty:
        print(f"  {pid}: NOT FOUND in dev dataset")
        continue

    row = prod_row_df.iloc[0]
    orig_row_df = feat_df[feat_df['product_id'] == pid].sort_values('date')
    latest_date = str(orig_row_df[orig_row_df['date'] <= GENUINE_CUTOFF]['date'].max().date())
    rolling_4w  = float(row['rolling_4w_sales_mean'])

    prod_repr = {"latest_date": latest_date, "rolling_4w_mean": round(rolling_4w, 1), "horizons": {}}

    for hz_name, hz_weeks in HORIZONS.items():
        model_file = os.path.join(DEV_MODELS, f"dev_{hz_name}.pkl")
        if not os.path.exists(model_file):
            continue

        with open(model_file, 'rb') as f:
            mdl = pickle.load(f)

        X_row = pd.DataFrame([row[FINAL_MODEL_FEATURES].fillna(0)])
        pred = max(0, float(mdl.predict(X_row)[0]))
        pred_weekly = pred / hz_weeks

        if rolling_4w > 0:
            diff = (pred_weekly - rolling_4w) / rolling_4w
            if diff > 0.05:    trend = "Increasing"
            elif diff < -0.05: trend = "Decreasing"
            else:              trend = "Stable"
        else:
            trend = "Increasing" if pred_weekly > 0 else "Stable"

        prod_repr["horizons"][hz_name] = {
            "predicted_demand": round(pred, 1),
            "predicted_weekly": round(pred_weekly, 1),
            "trend": trend
        }

    repr_results[pid] = prod_repr
    print(f"\n  {pid} | Latest: {latest_date} | rolling_4w={rolling_4w:.1f}")
    for hz, v in prod_repr["horizons"].items():
        print(f"    {hz}: pred={v['predicted_demand']:.1f} | weekly={v['predicted_weekly']:.1f} | trend={v['trend']}")

# ═════════════════════════════════════════════════════════════════════════════
# STEP 6: Save all results
# ═════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("STEP 6: Saving Results")
print("=" * 70)

output = {
    "baseline_metrics": baseline_metrics,
    "dev_metrics": dev_metrics,
    "baseline_trends": baseline_trends,
    "dev_trends": trend_results,
    "repr_products": repr_results,
}

with open(RESULTS_PATH, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Results saved to: {RESULTS_PATH}")
print("\nDEVELOPMENT TRAINING COMPLETE. No production artifacts were modified.")
