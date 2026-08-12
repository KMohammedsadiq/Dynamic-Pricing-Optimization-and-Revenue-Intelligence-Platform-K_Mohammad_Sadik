import pandas as pd
import numpy as np
import os

# 1. Load Dataset
data_path = 'data/demand_forecasting_dataset_final.csv'
print(f"Loading {data_path}...")
df = pd.read_csv(data_path)

# Ensure proper datetime parsing and sorting
df['date_parsed'] = pd.to_datetime(df['date'], dayfirst=True)
df = df.sort_values(by=['product_id', 'date_parsed']).reset_index(drop=True)

# 2. Leakage-Safe Base Features
print("Calculating leakage-safe base features...")
# We must safely calculate historical sales without including the current period
df['historical_sales_safe'] = df.groupby('product_id')['units_sold'].transform(lambda x: x.shift(1).cumsum().fillna(0))

# Create lag features (past 1, 2, 4, 8 weeks)
df['units_sold_lag_1'] = df.groupby('product_id')['units_sold'].shift(1)
df['units_sold_lag_2'] = df.groupby('product_id')['units_sold'].shift(2)
df['units_sold_lag_4'] = df.groupby('product_id')['units_sold'].shift(4)
df['units_sold_lag_8'] = df.groupby('product_id')['units_sold'].shift(8)

# Lag other sensitive variables by 1 week to avoid concurrent leakage
lag_cols = ['revenue', 'inventory_turnover', 'demand_index', 'inventory_level', 'stockout_flag', 'competitor_price']
for col in lag_cols:
    df[f'{col}_lag_1'] = df.groupby('product_id')[col].shift(1)

# Current price, promotion, and calendar are safe concurrent features
# (We assume price and promotions are planned ahead)

# 3. Rolling & Trend Features (Using ONLY lag_1 to prevent leakage)
print("Calculating rolling and trend features...")
def safe_rolling(group, window, agg_func):
    # rolling on lag_1 means current period is excluded
    return group['units_sold_lag_1'].rolling(window=window, min_periods=1).agg(agg_func)

for w in [4, 8, 12]:
    # Need to group by product and apply rolling on units_sold_lag_1
    pass # Wait, apply on groupby returns index sometimes messy, better to do:

for w in [4, 8, 12]:
    df[f'rolling_{w}w_sales_mean'] = df.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).mean())
    df[f'rolling_{w}w_sales_max'] = df.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).max())
    if w == 4:
        df[f'rolling_{w}w_sales_std'] = df.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).std()).fillna(0)

# 4w Sales Growth (comparing recent 4w mean against 4w mean from 4 weeks prior)
df['rolling_4w_sales_mean_lag_4'] = df.groupby('product_id')['rolling_4w_sales_mean'].shift(4)
df['sales_growth_4w'] = np.where(
    df['rolling_4w_sales_mean_lag_4'] > 0,
    (df['rolling_4w_sales_mean'] - df['rolling_4w_sales_mean_lag_4']) / df['rolling_4w_sales_mean_lag_4'],
    0
)
df.drop(columns=['rolling_4w_sales_mean_lag_4'], inplace=True)

# 4. Target Design (Future Horizons)
print("Calculating forecasting targets...")
horizons = {
    '7d': 1,
    '14d': 2,
    '30d': 4,
    '90d': 13,
    '180d': 26,
    '365d': 52
}

# The target is the sum of the *next* W periods.
for name, w in horizons.items():
    df[f'target_{name}'] = df.groupby('product_id')['units_sold'].transform(
        lambda x: x.rolling(window=w, min_periods=w).sum().shift(-w)
    )

# 5. Output Verification
print("\n--- TARGET CALCULATION MANUAL VERIFICATION ---")
sample_product = df['product_id'].iloc[0]
sample_df = df[df['product_id'] == sample_product].head(15)
print(f"Product: {sample_product}")
print(sample_df[['date_parsed', 'units_sold', 'target_7d', 'target_14d', 'target_30d']].to_string())

# 6. Chronological Validation Split Definitions & Horizon Availability
df['split'] = 'train'
df.loc[df['date_parsed'] >= pd.to_datetime('2026-01-01'), 'split'] = 'val'
df.loc[df['date_parsed'] >= pd.to_datetime('2026-07-01'), 'split'] = 'test'

print("\n--- SYNTHETIC DATA DISTRIBUTION ---")
print(pd.crosstab(df['split'], df['is_synthetic'], normalize='index') * 100)

print("\n--- HORIZON VALID SAMPLE COUNTS (Origins where full future window exists) ---")
for name in horizons.keys():
    valid_count = df[df[f'target_{name}'].notnull()].shape[0]
    print(f"target_{name}: {valid_count} valid origins ({valid_count/len(df)*100:.1f}%)")

# Cleanup and save
df.drop(columns=['date_parsed'], inplace=True)
output_path = 'data/demand_forecasting_features.csv'
df.to_csv(output_path, index=False)
print(f"\nSaved feature-engineered dataset to {output_path}")
