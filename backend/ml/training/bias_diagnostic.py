import os
import pandas as pd
import numpy as np
import pickle
import json
from sklearn.preprocessing import OrdinalEncoder

BASE_DIR = os.getcwd()
DATA_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting')

PROD_FEAT_PATH = os.path.join(DATA_DIR, 'demand_forecasting_features.csv')
FILL_FEAT_PATH = os.path.join(DATA_DIR, 'demand_forecasting_features_fill_dev.csv')
RESULTS_PATH = os.path.join(BASE_DIR, 'backend', 'ml', 'training', 'bias_diagnostic_results.json')

HORIZONS = {'7d': 1, '14d': 2, '30d': 4, '90d': 13, '180d': 26, '365d': 52}
PROD_BEST = {'7d': 'target_7d_Fold_4.pkl', '14d': 'target_14d_Fold_4.pkl', '30d': 'target_30d_Fold_4.pkl', 
             '90d': 'target_90d_Fold_3.pkl', '180d': 'target_180d_Fold_3.pkl'}
GENUINE_CUTOFF = pd.to_datetime('2026-08-10')

print("1. Loading datasets...")
df_prod = pd.read_csv(PROD_FEAT_PATH)
df_prod['date_dt'] = pd.to_datetime(df_prod['date'], format='%d-%m-%Y', errors='coerce')
df_fill = pd.read_csv(FILL_FEAT_PATH)
df_fill['date_dt'] = pd.to_datetime(df_fill['date'], format='%d-%m-%Y', errors='coerce')

if 'provenance_label' not in df_prod.columns:
    df_prod['provenance_label'] = df_prod.apply(
        lambda r: 'synthetic_historical' if r['is_synthetic'] == 1 else 
        ('genuine_future_observation' if r['period_type'] == 'sparse_snapshot' and r['date_dt'] > GENUINE_CUTOFF else 'genuine_historical'), 
        axis=1
    )

res = {}

# 1. TRAINING TARGET ANALYSIS
print("Running Target Analysis...")
res['target_analysis'] = {}
for hz, hz_w in HORIZONS.items():
    tcol = f'target_{hz}'
    if tcol in df_prod.columns:
        valid = df_prod[df_prod[tcol].notna()]
        synth = valid[valid['provenance_label'] == 'synthetic_historical'][tcol]
        gen = valid[valid['provenance_label'] == 'genuine_historical'][tcol]
        
        synth_mean = synth.mean() if not synth.empty else None
        gen_mean = gen.mean() if not gen.empty else None
        
        res['target_analysis'][hz] = {
            'synthetic_historical_mean': synth_mean,
            'genuine_historical_mean': gen_mean,
            'synthetic_count': len(synth),
            'genuine_count': len(gen)
        }

# 2. HISTORICAL SALES TREND
print("Running Historical Sales Trend...")
def calc_growth(df_sub):
    trends = []
    growths = []
    for pid, grp in df_sub.groupby('product_id'):
        grp = grp.sort_values('date_dt')
        if len(grp) < 10:
            continue
        first_half = grp.iloc[:len(grp)//2]['units_sold'].mean()
        second_half = grp.iloc[len(grp)//2:]['units_sold'].mean()
        if pd.isna(first_half) or first_half == 0:
            continue
        growth = (second_half - first_half) / first_half
        growths.append(growth)
        if growth > 0.05: trends.append('Increasing')
        elif growth < -0.05: trends.append('Decreasing')
        else: trends.append('Stable')
    
    if not trends:
        return {'Increasing': 0, 'Stable': 0, 'Decreasing': 0, 'median_growth': 0, 'growths': []}
    t = len(trends)
    return {
        'Increasing': sum(1 for x in trends if x == 'Increasing') / t * 100,
        'Stable': sum(1 for x in trends if x == 'Stable') / t * 100,
        'Decreasing': sum(1 for x in trends if x == 'Decreasing') / t * 100,
        'median_growth': np.median(growths),
        'growths': growths
    }

synth_hist = df_prod[df_prod['provenance_label'] == 'synthetic_historical']
gen_hist = df_prod[df_prod['provenance_label'] == 'genuine_historical']

res['sales_trend'] = {
    'synthetic': calc_growth(synth_hist),
    'genuine': calc_growth(gen_hist)
}
# Don't save the full raw arrays in json to avoid bloat
del res['sales_trend']['synthetic']['growths']
del res['sales_trend']['genuine']['growths']

# 3. DISTRIBUTION SHIFT
print("Running Distribution Shift...")
cols_to_compare = ['units_sold', 'rolling_4w_sales_mean', 'rolling_8w_sales_mean', 
                   'rolling_12w_sales_mean', 'sales_growth_4w', 'demand_index', 
                   'current_price', 'inventory_level', 'discount_pct']
res['dist_shift'] = {}
for col in cols_to_compare:
    if col in df_prod.columns:
        s_mean = synth_hist[col].mean()
        g_mean = gen_hist[col].mean()
        res['dist_shift'][col] = {'synthetic_mean': s_mean, 'genuine_mean': g_mean, 
                                  'diff_pct': ((g_mean - s_mean) / s_mean * 100) if s_mean and s_mean > 0 else 0}

# 4. MODEL PREDICTION BIAS
print("Running Prediction Bias...")
CAT_COLS = ['promotion_type','brand','category','product_lifecycle','month','day_of_week','season']
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

enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
df_fill[CAT_COLS] = enc.fit_transform(df_fill[CAT_COLS].fillna('Missing'))
fill_latest = df_fill[df_fill['date_dt'] <= GENUINE_CUTOFF].sort_values('date_dt').groupby('product_id').last().reset_index()

hz_eval = '30d'
hz_w = HORIZONS[hz_eval]
mdl_path = os.path.join(MODELS_DIR, PROD_BEST[hz_eval])
with open(mdl_path, 'rb') as f:
    mdl = pickle.load(f)

rows = fill_latest[FINAL_FEATS].copy().fillna(0)
preds = np.maximum(0, mdl.predict(rows))

bias_ratios = []
for idx, row in fill_latest.iterrows():
    pred_w = preds[idx] / hz_w
    r4w = row['rolling_4w_sales_mean']
    if pd.notna(r4w) and r4w > 0:
        bias_ratios.append(pred_w / r4w)
    else:
        bias_ratios.append(np.nan)

bias_series = pd.Series(bias_ratios).dropna()
res['pred_bias'] = {
    'mean': bias_series.mean(),
    'median': bias_series.median(),
    'p10': bias_series.quantile(0.10),
    'p25': bias_series.quantile(0.25),
    'p50': bias_series.quantile(0.50),
    'p75': bias_series.quantile(0.75),
    'p90': bias_series.quantile(0.90),
    'p95': bias_series.quantile(0.95),
    'max': bias_series.max()
}

# 5. PRODUCT-LEVEL ANALYSIS (20 products)
print("Running Product Analysis...")
# pick random subset 20 products
np.random.seed(42)
sampled_pids = np.random.choice(fill_latest['product_id'].unique(), 20, replace=False)

res['products'] = {}
for pid in sampled_pids:
    row = fill_latest[fill_latest['product_id'] == pid].iloc[0]
    r4w = row['rolling_4w_sales_mean']
    idx = fill_latest.index[fill_latest['product_id'] == pid][0]
    pred_w = preds[idx] / hz_w
    diff_pct = ((pred_w - r4w) / r4w * 100) if r4w > 0 else 0
    
    trend = 'Increasing' if diff_pct > 5 else ('Decreasing' if diff_pct < -5 else 'Stable')
    prov = row['provenance_label']
    
    # get historical trend for this product in genuine/synthetic
    hist = df_prod[df_prod['product_id'] == pid].sort_values('date_dt')
    if len(hist) > 10:
        fh = hist.iloc[:len(hist)//2]['units_sold'].mean()
        sh = hist.iloc[len(hist)//2:]['units_sold'].mean()
        if fh > 0:
            hg = (sh - fh) / fh
            hist_trend = 'Increasing' if hg > 0.05 else ('Decreasing' if hg < -0.05 else 'Stable')
        else:
            hist_trend = 'Stable'
    else:
        hist_trend = 'Unknown'
        
    res['products'][pid] = {
        'rolling_4w': r4w,
        'pred_weekly': pred_w,
        'diff_pct': diff_pct,
        'predicted_trend': trend,
        'historical_trend': hist_trend,
        'latest_provenance': prov
    }

with open(RESULTS_PATH, 'w') as f:
    json.dump(res, f, indent=2)

print("Diagnostic script completed successfully.")
