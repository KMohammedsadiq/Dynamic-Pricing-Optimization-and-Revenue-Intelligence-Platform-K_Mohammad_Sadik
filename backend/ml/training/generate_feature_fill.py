import os
import pandas as pd
import numpy as np
import pickle
import hashlib
from sklearn.preprocessing import OrdinalEncoder
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.getcwd()
DATA_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting')

ORIG_FILE = os.path.join(DATA_DIR, 'demand_forecasting_dataset_final.csv')
FILL_FILE = os.path.join(DATA_DIR, 'demand_forecasting_feature_fill_dev.csv')
FEAT_FILE = os.path.join(DATA_DIR, 'demand_forecasting_features_fill_dev.csv')
PROD_FEAT = os.path.join(DATA_DIR, 'demand_forecasting_features.csv')

GENUINE_CUTOFF = pd.to_datetime('2026-08-10')

print("1. Loading original dataset...")
df = pd.read_csv(ORIG_FILE)
df['date_dt'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
original_rows_count = len(df)

# Apply baseline provenance if missing
if 'provenance_label' not in df.columns:
    def label_prov(r):
        if r['is_synthetic'] == 1: return 'synthetic_historical'
        elif r['period_type'] == 'sparse_snapshot' and pd.to_datetime(r['date'], format='%d-%m-%Y') > GENUINE_CUTOFF:
            return 'genuine_future_observation'
        else: return 'genuine_historical'
    df['provenance_label'] = df.apply(label_prov, axis=1)

print("2. Generating feature-fill dataset (Method D)...")
new_rows = []

products = df['product_id'].unique()

def get_hash_noise(pid, dt, prefix=''):
    h = int(hashlib.md5((prefix + str(pid) + str(dt)).encode()).hexdigest(), 16)
    return h

for idx, pid in enumerate(products):
    p_df = df[df['product_id'] == pid].sort_values('date_dt')
    weekly_df = p_df[p_df['period_type'] == 'weekly']
    if weekly_df.empty:
        # If no weekly data, skip
        continue
        
    last_weekly_row = weekly_df.iloc[-1]
    last_weekly_dt = last_weekly_row['date_dt']
    
    target_dates = pd.date_range(start=last_weekly_dt + pd.Timedelta(days=7), end=GENUINE_CUTOFF, freq='W-WED')
    
    if len(target_dates) == 0:
        continue
        
    units_min = p_df['units_sold'].min()
    units_max = p_df['units_sold'].max()
    inv_median = p_df['inventory_level'].median()
    inv_min = p_df['inventory_level'].min()
    
    promo_prob = (p_df['discount_pct'] > 0).mean()
    avg_discount = p_df[p_df['discount_pct'] > 0]['discount_pct'].mean()
    if pd.isna(avg_discount): avg_discount = 5.0
    promo_types = p_df[p_df['promotion_type'] != 'None']['promotion_type'].value_counts()
    top_promo = promo_types.index[0] if not promo_types.empty else 'Percentage'
    
    base_price = last_weekly_row['base_price']
    comp_ratio = p_df['competitor_price'].mean() / p_df['current_price'].mean() if p_df['current_price'].mean() > 0 else 1.0
    
    current_inv = last_weekly_row['inventory_level']
    cum_sales = last_weekly_row['historical_sales'] + last_weekly_row['units_sold']
    
    recent_mean = weekly_df.tail(4)['units_sold'].mean()
    if pd.isna(recent_mean): recent_mean = 0

    for dt in target_dates:
        week = dt.isocalendar().week
        
        # Method D: 50% recent mean + 50% 2025 seasonal reference
        ref = p_df[(p_df['date_dt'].dt.year == 2025) & (p_df['date_dt'].dt.isocalendar().week == week)]
        base_units = ref.iloc[0]['units_sold'] if not ref.empty else recent_mean
        
        noise = 0.95 + (get_hash_noise(pid, dt, 'u') % 100) / 1000.0
        
        units = (0.5 * base_units + 0.5 * recent_mean) * noise
        units = int(np.clip(units, units_min, units_max))
        
        # update recent mean
        recent_mean = (recent_mean * 3 + units) / 4
        
        is_promo = (get_hash_noise(pid, dt, 'p') % 100) / 100.0 < promo_prob
        discount = round(avg_discount, 2) if is_promo else 0.0
        promo_type = top_promo if is_promo else 'None'
        
        current_price = round(base_price * (1 - discount/100.0), 2)
        comp_price = round(current_price * comp_ratio, 2)
        
        if current_inv - units < inv_min or current_inv < inv_median * 0.5:
            replenish = max(0, inv_median - (current_inv - units))
        else:
            replenish = 0
        current_inv = max(0, current_inv + replenish - units)
        
        revenue = round(units * current_price, 2)
        
        new_row = last_weekly_row.copy()
        new_row['date'] = dt.strftime('%d-%m-%Y')
        new_row['date_dt'] = dt
        new_row['year'] = dt.year
        new_row['month'] = dt.month
        new_row['week'] = week
        new_row['quarter'] = dt.quarter
        new_row['day_of_week'] = 'Wednesday'
        
        m = dt.month
        if m in [3, 4, 5]: season = 'Spring'
        elif m in [6, 7, 8]: season = 'Summer'
        elif m in [9, 10, 11]: season = 'Autumn'
        else: season = 'Winter'
        new_row['season'] = season
        
        new_row['units_sold'] = units
        new_row['historical_sales'] = cum_sales
        new_row['current_price'] = current_price
        new_row['discount_pct'] = discount
        new_row['promotion_type'] = promo_type
        new_row['promo_active_share'] = 1.0 if discount > 0 else 0.0
        new_row['competitor_price'] = comp_price
        new_row['inventory_level'] = current_inv
        new_row['revenue'] = revenue
        
        new_row['period_type'] = 'weekly'
        new_row['is_synthetic'] = 1
        new_row['provenance_label'] = 'synthetic_feature_fill'
        
        new_row['base_price'] = base_price
        new_row['cost_price'] = last_weekly_row['cost_price']
        new_row['profit_margin'] = (current_price - last_weekly_row['cost_price']) / current_price if current_price > 0 else 0
        new_row['days_since_first_observed'] = last_weekly_row['days_since_first_observed'] + (dt - last_weekly_dt).days
        
        new_row['holiday_flag'] = 0
        new_row['holiday_name'] = 'None'
        new_row['festival_flag'] = 0
        new_row['festival_name'] = 'None'
        
        new_rows.append(new_row)
        
        cum_sales += units

print(f"Generated {len(new_rows)} feature-fill rows.")

fill_df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
fill_df = fill_df.sort_values(['product_id', 'date_dt', 'is_synthetic']).reset_index(drop=True)

# Drop duplicates (keep existing genuine rows over generated synthetic ones)
fill_df = fill_df.drop_duplicates(subset=['product_id', 'date_dt'], keep='first').reset_index(drop=True)

print("3. Validating the generated dataset...")
repaired_products = fill_df[fill_df['provenance_label'] == 'synthetic_feature_fill']['product_id'].nunique()
v_orig = (len(fill_df) == original_rows_count + len(new_rows))
v_dupes = fill_df.duplicated(subset=['product_id', 'date_dt']).sum()
v_neg_units = (fill_df['units_sold'] < 0).sum()
v_neg_inv = (fill_df['inventory_level'] < 0).sum()
v_neg_price = (fill_df['current_price'] <= 0).sum()

gen_df = fill_df[fill_df['provenance_label'] == 'synthetic_feature_fill']
v_max_date = gen_df['date_dt'].max() if not gen_df.empty else None
v_future = (gen_df['date_dt'] > GENUINE_CUTOFF).sum() if not gen_df.empty else 0

fill_df.drop(columns=['date_dt'], inplace=True)
fill_df.to_csv(FILL_FILE, index=False)

print(f"Validation:")
print(f"  Repaired products: {repaired_products}")
print(f"  Original rows intact: {v_orig}")
print(f"  Duplicates: {v_dupes}")
print(f"  Negative units: {v_neg_units}")
print(f"  Negative inventory: {v_neg_inv}")
print(f"  Negative price: {v_neg_price}")
print(f"  Max generated date: {v_max_date}")
print(f"  Dates beyond cutoff: {v_future}")
print("\nProvenance breakdown:")
print(fill_df['provenance_label'].value_counts())

# --- Feature Engineering ---
print("\n4. Running Feature Engineering on Fill Dataset...")
feat = fill_df.copy()
feat['date_parsed'] = pd.to_datetime(feat['date'], dayfirst=True)
feat = feat.sort_values(by=['product_id', 'date_parsed']).reset_index(drop=True)

feat['historical_sales_safe'] = feat.groupby('product_id')['units_sold'].transform(lambda x: x.shift(1).cumsum().fillna(0))
feat['units_sold_lag_1'] = feat.groupby('product_id')['units_sold'].shift(1)
feat['units_sold_lag_2'] = feat.groupby('product_id')['units_sold'].shift(2)
feat['units_sold_lag_4'] = feat.groupby('product_id')['units_sold'].shift(4)
feat['units_sold_lag_8'] = feat.groupby('product_id')['units_sold'].shift(8)
lag_cols = ['revenue', 'inventory_turnover', 'demand_index', 'inventory_level', 'stockout_flag', 'competitor_price']
for col in lag_cols:
    feat[f'{col}_lag_1'] = feat.groupby('product_id')[col].shift(1)

for w in [4, 8, 12]:
    feat[f'rolling_{w}w_sales_mean'] = feat.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).mean())
    feat[f'rolling_{w}w_sales_max'] = feat.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).max())
    if w == 4:
        feat[f'rolling_{w}w_sales_std'] = feat.groupby('product_id')['units_sold_lag_1'].transform(lambda x: x.rolling(window=w, min_periods=1).std()).fillna(0)

feat['rolling_4w_sales_mean_lag_4'] = feat.groupby('product_id')['rolling_4w_sales_mean'].shift(4)
feat['sales_growth_4w'] = np.where(feat['rolling_4w_sales_mean_lag_4'] > 0,
    (feat['rolling_4w_sales_mean'] - feat['rolling_4w_sales_mean_lag_4']) / feat['rolling_4w_sales_mean_lag_4'], 0)
feat.drop(columns=['rolling_4w_sales_mean_lag_4'], inplace=True)

feat.drop(columns=['date_parsed'], inplace=True)
feat.to_csv(FEAT_FILE, index=False)

# --- Inference Comparison ---
print("\n5. Running Inference Comparison...")

PROD_BEST = {'7d':'target_7d_Fold_4.pkl','14d':'target_14d_Fold_4.pkl','30d':'target_30d_Fold_4.pkl','90d':'target_90d_Fold_3.pkl','180d':'target_180d_Fold_3.pkl'}
HORIZONS = {'7d':1,'14d':2,'30d':4,'90d':13,'180d':26}
FINAL_FEATS = [
    'units_sold_lag_1','units_sold_lag_2','units_sold_lag_4','units_sold_lag_8',
    'revenue_lag_1','inventory_turnover_lag_1','demand_index_lag_1',
    'inventory_level_lag_1','stockout_flag_lag_1','competitor_price_lag_1',
    'historical_sales_safe','rolling_4w_sales_mean','rolling_4w_sales_max',
    'rolling_4w_sales_std','rolling_8w_sales_mean','rolling_8w_sales_max',
    'rolling_12w_sales_mean','rolling_12w_sales_max','sales_growth_4w',
    'base_price','cost_price','current_price','discount_pct','promotion_type',
    'promo_active_share','brand','category','product_lifecycle','launch_year',
    'is_cold_start_product','average_rating','review_count','profit_margin',
    'period_index','year','month','week','quarter','day_of_week','season',
    'holiday_flag','festival_flag','days_since_first_observed'
]
CAT_COLS = ['promotion_type','brand','category','product_lifecycle','month','day_of_week','season']

def get_trend(pred, weeks, rolling):
    w = pred / weeks
    if rolling > 0:
        d = (w - rolling) / rolling
        if d > 0.05:    return 'Increasing'
        elif d < -0.05: return 'Decreasing'
        else:           return 'Stable'
    return 'Increasing' if w > 0 else 'Stable'

print("Loading baseline features...")
prod_feat = pd.read_csv(PROD_FEAT)
prod_feat['date'] = pd.to_datetime(prod_feat['date'], format='%d-%m-%Y', errors='coerce')
enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
prod_feat[CAT_COLS] = enc.fit_transform(prod_feat[CAT_COLS].fillna('Missing'))
base_latest = prod_feat[prod_feat['date'] <= GENUINE_CUTOFF].sort_values('date').groupby('product_id').last().reset_index()

print("Loading fill features...")
feat['date'] = pd.to_datetime(feat['date'], format='%d-%m-%Y', errors='coerce')
feat[CAT_COLS] = enc.transform(feat[CAT_COLS].fillna('Missing'))
fill_latest = feat[feat['date'] <= GENUINE_CUTOFF].sort_values('date').groupby('product_id').last().reset_index()

results = {'base_trends': {}, 'fill_trends': {}, 'repr': {}}

# Compare catalog trends
for hz, wks in HORIZONS.items():
    mf = os.path.join(MODELS_DIR, PROD_BEST[hz])
    if not os.path.exists(mf): continue
    with open(mf, 'rb') as f: mdl = pickle.load(f)
    
    # Baseline
    rows_base = base_latest[FINAL_FEATS].copy().fillna(0)
    preds_base = np.maximum(0, mdl.predict(rows_base))
    c_base = {'Increasing':0, 'Stable':0, 'Decreasing':0}
    for idx, (_, row) in enumerate(base_latest.iterrows()):
        c_base[get_trend(preds_base[idx], wks, row['rolling_4w_sales_mean'])] += 1
    t_base = sum(c_base.values())
    results['base_trends'][hz] = {k: round(v/t_base*100,1) for k,v in c_base.items()}
    
    # Fill
    rows_fill = fill_latest[FINAL_FEATS].copy().fillna(0)
    preds_fill = np.maximum(0, mdl.predict(rows_fill))
    c_fill = {'Increasing':0, 'Stable':0, 'Decreasing':0}
    for idx, (_, row) in enumerate(fill_latest.iterrows()):
        c_fill[get_trend(preds_fill[idx], wks, row['rolling_4w_sales_mean'])] += 1
    t_fill = sum(c_fill.values())
    results['fill_trends'][hz] = {k: round(v/t_fill*100,1) for k,v in c_fill.items()}
    
    print(f"{hz} Base Trends: {results['base_trends'][hz]}")
    print(f"{hz} Fill Trends: {results['fill_trends'][hz]}")

# Compare specific products
REPR = ['ACC001', 'ACC002', 'BOK501', 'ELE509', 'ACC014', 'TOY507', 'OFF503']
for pid in REPR:
    b_row = base_latest[base_latest['product_id'] == pid].iloc[0]
    f_row = fill_latest[fill_latest['product_id'] == pid].iloc[0]
    
    results['repr'][pid] = {
        'base_date': str(b_row['date'].date()),
        'fill_date': str(f_row['date'].date()),
        'base_rolling': round(b_row['rolling_4w_sales_mean'], 1),
        'fill_rolling': round(f_row['rolling_4w_sales_mean'], 1),
        'horizons': {}
    }
    
    for hz, wks in HORIZONS.items():
        mf = os.path.join(MODELS_DIR, PROD_BEST[hz])
        if not os.path.exists(mf): continue
        with open(mf, 'rb') as f: mdl = pickle.load(f)
        
        b_x = pd.DataFrame([b_row[FINAL_FEATS].fillna(0)])
        b_pred = max(0.0, float(mdl.predict(b_x)[0]))
        b_trend = get_trend(b_pred, wks, b_row['rolling_4w_sales_mean'])
        
        f_x = pd.DataFrame([f_row[FINAL_FEATS].fillna(0)])
        f_pred = max(0.0, float(mdl.predict(f_x)[0]))
        f_trend = get_trend(f_pred, wks, f_row['rolling_4w_sales_mean'])
        
        results['repr'][pid]['horizons'][hz] = {
            'base_pred': round(b_pred,1),
            'base_trend': b_trend,
            'fill_pred': round(f_pred,1),
            'fill_trend': f_trend
        }

import json
with open('backend/ml/training/fill_validation_results.json', 'w') as f:
    json.dump(results, f, indent=2)
print("\nValidation completed. Results saved.")
