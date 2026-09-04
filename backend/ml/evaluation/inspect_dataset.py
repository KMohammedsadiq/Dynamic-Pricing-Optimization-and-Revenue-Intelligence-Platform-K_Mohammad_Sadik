"""
Dataset inspection script for Milestone 4 methodology analysis.
Run from backend/ directory.
"""
import pandas as pd
import numpy as np
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "retail_price_optimization_dataset_improved.csv")

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Total rows: {len(df):,}")

# Date analysis
df['date'] = pd.to_datetime(df['date'], errors='coerce')
print(f"\n=== Date Column ===")
print(f"Date range:  {df['date'].min().date()} to {df['date'].max().date()}")
print(f"Null dates:  {df['date'].isna().sum()}")
print(f"Unique dates: {df['date'].nunique()}")

# Sort by date and find 80th percentile cutoff
df_sorted = df.sort_values('date').reset_index(drop=True)
cutoff_idx = int(len(df_sorted) * 0.80)
cutoff_date = df_sorted.iloc[cutoff_idx]['date']
print(f"Chronological 80-pct index: {cutoff_idx:,} of {len(df_sorted):,}")
print(f"Chronological 80-pct date:  {cutoff_date.date()}")

# Row counts by date chunks
print(f"\n=== Row distribution by date ===")
date_counts = df['date'].value_counts().sort_index()
print(f"Rows per date (min/max/mean): {date_counts.min()} / {date_counts.max()} / {date_counts.mean():.1f}")
first_dates = date_counts.head(5)
last_dates = date_counts.tail(5)
print(f"First 5 dates:")
for d, c in first_dates.items():
    print(f"  {d.date()}: {c} rows")
print(f"Last 5 dates:")
for d, c in last_dates.items():
    print(f"  {d.date()}: {c} rows")

# Promotion type check
print(f"\n=== Promotion Types in RAW CSV ===")
promo_counts = df['promotion_type'].value_counts()
for p, c in promo_counts.items():
    print(f"  {p!r}: {c:,}")
print(f"  Total 'Festival Offer' rows: {(df['promotion_type'] == 'Festival Offer').sum()}")

# Product IDs
print(f"\n=== Product IDs ===")
print(f"Unique product_ids: {df['product_id'].nunique()}")

# Simulate Festival Offer injection (same as train_xgboost.py)
print(f"\n=== Festival Offer Injection Simulation ===")
festival_base = df.sample(frac=0.06, random_state=7)
festival_rows = festival_base.copy()
festival_rows['promotion_type'] = 'Festival Offer'
df_augmented = pd.concat([df, festival_rows], ignore_index=True)
print(f"Original rows:     {len(df):,}")
print(f"Festival rows added: {len(festival_rows):,}")
print(f"Augmented total:   {len(df_augmented):,}")
print(f"Expected test set size (20%): {int(len(df_augmented) * 0.20):,}")
print(f"Expected train set size (80%): {int(len(df_augmented) * 0.80):,}")

# Check how many festival rows would leak into training vs test
# With random_state=42, 20% => ~42,533 rows in test out of 212,714 total
from sklearn.model_selection import train_test_split
df_aug_target = df_augmented.copy()

def calculate_optimal_price(row):
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
    if competitor > current * 1.05: opt = current * 1.05
    elif competitor < current * 0.95: opt = current * 0.95
    if demand >= 80 and inventory <= 50: opt *= 1.05
    elif demand <= 40 and inventory >= 150: opt *= 0.95
    if opt < cost * 1.10: opt = cost * 1.10
    if lifecycle == "End of Life": opt *= 0.95
    elif lifecycle == "Introduction": opt *= 1.05
    if rating >= 4.5: opt *= 1.02
    elif rating < 3.0: opt *= 0.98
    if promo == "Clearance": opt *= 0.90
    elif promo == "Flash Sale": opt *= 0.92
    elif promo == "Festival Offer": opt *= 0.95
    elif promo == "Percentage Discount": opt *= 0.97
    elif promo == "Buy One Get One": opt *= 0.96
    elif promo == "Member Offer": opt *= 0.98
    if season == "Winter" and category == "Apparel": opt *= 1.05
    if sales > 10000: opt *= 1.02
    elif sales < 7000: opt *= 0.98
    return opt

print("\nComputing targets for augmented dataset...")
df_augmented['optimal_price'] = df_augmented.apply(calculate_optimal_price, axis=1)
y = df_augmented['optimal_price'] / df_augmented['current_price']

DROP_COLS = [
    "optimal_price", "product_id", "product_name",
    "product_model", "date", "current_price",
    "revenue", "units_sold", "price_change_pct", "discount_pct",
    "stockout_flag", "day_of_week", "month", "region", "sales_channel"
]
X = df_augmented.drop(columns=DROP_COLS)

# Exact same split as training
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
print(f"\n=== Split with random_state=42 (SAME as training) ===")
print(f"X_train: {len(X_train):,} rows | X_test: {len(X_test):,} rows")

# Now check: is this test set independent?
# The model.fit() was called on X_train with this EXACT split.
# Reproducing it gives the SAME X_test the model never trained on.
# But: is it an INDEPENDENT evaluation?
print(f"\n=== Independence Analysis ===")
print("The model was trained on X_train[random_state=42].")
print("Recreating with same seed gives the EXACT same test set.")
print("This reproduces training-time evaluation — NOT an independent test.")
print()

# Check for Festival Offer duplicate contamination
# Each Festival Offer row is a clone of an original row.
# If the original is in X_train and its clone is in X_test, 
# the model was trained on nearly identical features.
# However: the original has a DIFFERENT promotion_type, so different target.
# The model could learn to predict Festival Offer rows purely from
# the pattern it saw in the original row.

# Count how many festival rows are in test set (from augmented df)
n_festival_test = (X_test['promotion_type'] == 'Festival Offer').sum()
n_festival_train = (X_train['promotion_type'] == 'Festival Offer').sum()
print(f"Festival Offer rows in test set:  {n_festival_test:,}")
print(f"Festival Offer rows in train set: {n_festival_train:,}")
print()
print("PROBLEM: Festival Offer rows are DUPLICATES of original rows.")
print("Even in the test set, their near-identical originals are likely in train,")
print("meaning the model memorizes these rows rather than generalizing.")

# Temporal split analysis
print(f"\n=== Temporal Split Analysis (Valid Alternative) ===")
# Use the original dataset (no Festival Offer injection) sorted by date
df_orig = pd.read_csv(DATA_PATH)
df_orig['date'] = pd.to_datetime(df_orig['date'], errors='coerce')
df_orig_sorted = df_orig.sort_values('date').reset_index(drop=True)

cutoff_idx = int(len(df_orig_sorted) * 0.80)
temporal_cutoff = df_orig_sorted.iloc[cutoff_idx]['date']
train_temporal = df_orig_sorted[df_orig_sorted['date'] < temporal_cutoff]
test_temporal = df_orig_sorted[df_orig_sorted['date'] >= temporal_cutoff]

print(f"Original dataset sorted chronologically:")
print(f"  Train (before cutoff {temporal_cutoff.date()}): {len(train_temporal):,} rows")
print(f"  Test  (from cutoff onwards):              {len(test_temporal):,} rows")
print(f"  Festival Offer in original test set: {(test_temporal['promotion_type']=='Festival Offer').sum()}")
print(f"  Unique products in test set: {test_temporal['product_id'].nunique()}")
print(f"  Unique products in train set: {train_temporal['product_id'].nunique()}")
print()
print("This temporal split:")
print("  - Is NOT the same split as training (different rows selected)")
print("  - Does NOT include injected Festival Offer duplicates")
print("  - Is chronologically valid (model trained on past, tested on future)")
print("  - Uses REAL data rows only (no synthetic duplicates)")
print()

# Check y-variance in test set
df_orig_sorted['optimal_price'] = df_orig_sorted.apply(calculate_optimal_price, axis=1)
y_temporal = df_orig_sorted['optimal_price'] / df_orig_sorted['current_price']
y_test_temporal = y_temporal[df_orig_sorted['date'] >= temporal_cutoff]
print(f"Target (multiplier) stats in temporal test set:")
print(f"  Mean:   {y_test_temporal.mean():.4f}")
print(f"  Std:    {y_test_temporal.std():.4f}")
print(f"  Min:    {y_test_temporal.min():.4f}")
print(f"  Max:    {y_test_temporal.max():.4f}")
print(f"  Unique values: {y_test_temporal.nunique()}")
