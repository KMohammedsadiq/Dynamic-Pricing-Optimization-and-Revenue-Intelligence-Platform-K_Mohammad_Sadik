import os
import pandas as pd
import numpy as np
import pickle

BASE_DIR = os.getcwd()
DEV_MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting_dev')

models_to_check = ['genuine_14d.pkl', 'genuine_30d.pkl', 'genuine_90d.pkl']

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

print("Verifying models...")
# Create a dummy row matching the features exactly
dummy_row = pd.DataFrame([np.random.rand(len(FINAL_MODEL_FEATURES))], columns=FINAL_MODEL_FEATURES)

for m in models_to_check:
    m_path = os.path.join(DEV_MODELS_DIR, m)
    print(f"\nChecking {m}...")
    if not os.path.exists(m_path):
        print("  ERROR: File not found!")
        continue
    print("  1. Loads successfully.")
    
    with open(m_path, 'rb') as f:
        mdl = pickle.load(f)
        
    # Check features
    if hasattr(mdl, 'feature_names_in_'):
        feat_match = list(mdl.feature_names_in_) == FINAL_MODEL_FEATURES
        print(f"  2. Exact feature match: {feat_match}")
    else:
        print("  2. Model has no feature_names_in_ attribute, assuming positional match.")
        
    try:
        pred = mdl.predict(dummy_row)
        is_finite = np.isfinite(pred[0])
        print(f"  3/4. Produces finite prediction: {is_finite}. Value: {pred[0]}")
    except Exception as e:
        print(f"  ERROR during prediction: {e}")
        
print("Verification complete.")
