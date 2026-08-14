"""
Steps 4 & 5 only: Trend diagnostic + representative product deep-dive
Run after dev models are already trained (Step 2 complete).
Saves: training/dev_comparison_results.json
"""
import os, json, pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import OrdinalEncoder

GENUINE_CUTOFF = pd.to_datetime('2026-08-10')
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD_FEAT  = os.path.join(BASE_DIR, 'data', 'demand_forecasting_features.csv')
DEV_FEAT   = os.path.join(BASE_DIR, 'data', 'demand_forecasting_features_dev.csv')
PROD_MODELS= os.path.join(BASE_DIR, 'models', 'demand_forecasting')
DEV_MODELS = os.path.join(BASE_DIR, 'models', 'demand_forecasting_dev')
RESULTS_OUT= os.path.join(BASE_DIR, 'training', 'dev_comparison_results.json')

HORIZONS = {'7d':1,'14d':2,'30d':4,'90d':13,'180d':26}
PROD_BEST = {
    '7d':   'target_7d_Fold_4.pkl',
    '14d':  'target_14d_Fold_4.pkl',
    '30d':  'target_30d_Fold_4.pkl',
    '90d':  'target_90d_Fold_3.pkl',
    '180d': 'target_180d_Fold_3.pkl',
}
CAT_COLS = ['promotion_type','brand','category','product_lifecycle',
            'month','day_of_week','season']

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

def get_trend(pred, weeks, rolling):
    w = pred / weeks
    if rolling > 0:
        d = (w - rolling) / rolling
        if d > 0.05:    return 'Increasing'
        elif d < -0.05: return 'Decreasing'
        else:           return 'Stable'
    return 'Increasing' if w > 0 else 'Stable'

def compute_trend_dist(latest_df, model_dir, model_name, hz_weeks):
    mf = os.path.join(model_dir, model_name)
    if not os.path.exists(mf):
        return None
    with open(mf, 'rb') as f:
        mdl = pickle.load(f)
    rows = latest_df[FINAL_FEATS].copy().fillna(0)
    preds = np.maximum(0, mdl.predict(rows))
    c = {'Increasing': 0, 'Stable': 0, 'Decreasing': 0}
    for idx, (_, row) in enumerate(latest_df.iterrows()):
        c[get_trend(float(preds[idx]), hz_weeks, float(row['rolling_4w_sales_mean']))] += 1
    t = sum(c.values())
    return {k: round(v / t * 100, 1) for k, v in c.items()}

# ── Load Dev Features ──────────────────────────────────────────────────────────
print('Loading dev features...')
df = pd.read_csv(DEV_FEAT)
df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
dev_latest = (
    df[df['date'] <= GENUINE_CUTOFF]
    .sort_values('date')
    .groupby('product_id')
    .last()
    .reset_index()
)
print(f'Dev latest: {len(dev_latest)} products')

# ── Load Prod Features (encode strings) ────────────────────────────────────────
print('Loading prod features...')
pf = pd.read_csv(PROD_FEAT)
pf['date'] = pd.to_datetime(pf['date'], format='%d-%m-%Y', errors='coerce')
enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
pf[CAT_COLS] = enc.fit_transform(pf[CAT_COLS].fillna('Missing'))
prod_latest = (
    pf[pf['date'] <= GENUINE_CUTOFF]
    .sort_values('date')
    .groupby('product_id')
    .last()
    .reset_index()
)
print(f'Prod latest: {len(prod_latest)} products')

# ── DEV Trend Distribution ─────────────────────────────────────────────────────
print('\n--- DEV TREND DISTRIBUTION ---')
dev_trends = {}
for hz, wks in HORIZONS.items():
    result = compute_trend_dist(dev_latest, DEV_MODELS, 'dev_' + hz + '.pkl', wks)
    if result:
        dev_trends[hz] = result
        I = result['Increasing']
        S = result['Stable']
        D = result['Decreasing']
        print(f'  DEV  {hz}: Increasing={I}%  Stable={S}%  Decreasing={D}%')

# ── BASELINE Trend Distribution ─────────────────────────────────────────────────
print('\n--- BASELINE TREND DISTRIBUTION ---')
baseline_trends = {}
for hz, wks in HORIZONS.items():
    result = compute_trend_dist(prod_latest, PROD_MODELS, PROD_BEST[hz], wks)
    if result:
        baseline_trends[hz] = result
        I = result['Increasing']
        S = result['Stable']
        D = result['Decreasing']
        print(f'  PROD {hz}: Increasing={I}%  Stable={S}%  Decreasing={D}%')

# ── Representative Products ────────────────────────────────────────────────────
REPR_PRODS = ['ACC001', 'ACC002', 'BOK501', 'ELE509', 'ACC014', 'TOY507', 'OFF503']
print('\n--- REPRESENTATIVE PRODUCT DEEP-DIVE ---')
repr_res = {}
for pid in REPR_PRODS:
    row_df = dev_latest[dev_latest['product_id'] == pid]
    if row_df.empty:
        print(f'  {pid}: NOT FOUND')
        continue
    row = row_df.iloc[0]

    orig = df[df['product_id'] == pid].sort_values('date')
    latest_date = str(orig[orig['date'] <= GENUINE_CUTOFF]['date'].max().date())
    rolling_4w  = float(row['rolling_4w_sales_mean'])

    repr_res[pid] = {
        'latest_date': latest_date,
        'rolling_4w': round(rolling_4w, 1),
        'horizons': {}
    }
    print(f'\n  {pid} | Latest={latest_date} | rolling_4w={rolling_4w:.1f}')

    for hz, wks in HORIZONS.items():
        mf = os.path.join(DEV_MODELS, 'dev_' + hz + '.pkl')
        if not os.path.exists(mf):
            continue
        with open(mf, 'rb') as f:
            mdl = pickle.load(f)
        X = pd.DataFrame([row[FINAL_FEATS].fillna(0)])
        pred = max(0.0, float(mdl.predict(X)[0]))
        trend = get_trend(pred, wks, rolling_4w)
        repr_res[pid]['horizons'][hz] = {
            'predicted': round(pred, 1),
            'weekly': round(pred / wks, 1),
            'trend': trend
        }
        print(f'    {hz}: pred={pred:.1f}  weekly={pred/wks:.1f}  trend={trend}')

# ── Save Results ───────────────────────────────────────────────────────────────
results = {
    'baseline_metrics': {
        '7d':   {'mae': 27.3,   'rmse': 48.4,   'r2': 0.960, 'smape': 10.8},
        '14d':  {'mae': 47.0,   'rmse': 80.0,   'r2': 0.972, 'smape': 9.1},
        '30d':  {'mae': 85.9,   'rmse': 141.6,  'r2': 0.978, 'smape': 8.6},
        '90d':  {'mae': 1809.6, 'rmse': 2463.2, 'r2': 0.349, 'smape': 38.9},
        '180d': {'mae': 2257.5, 'rmse': 2808.6, 'r2': 0.140, 'smape': 18.6},
    },
    'dev_metrics': {
        '7d':   {'mae': 84.35,   'rmse': 135.05,  'r2': 0.6640, 'smape': 29.25,
                 'n_train': 89498, 'n_val': 21767},
        '14d':  {'mae': 168.92,  'rmse': 273.90,  'r2': 0.6422, 'smape': 28.21,
                 'n_train': 89498, 'n_val': 21022},
        '30d':  {'mae': 281.63,  'rmse': 505.40,  'r2': 0.6880, 'smape': 23.19,
                 'n_train': 89498, 'n_val': 19532},
        '90d':  {'mae': 955.37,  'rmse': 1488.98, 'r2': 0.7225, 'smape': 24.65,
                 'n_train': 89498, 'n_val': 12876},
        '180d': {'mae': 1785.77, 'rmse': 3099.33, 'r2': 0.6869, 'smape': 22.59,
                 'n_train': 89454, 'n_val': 3461},
    },
    'baseline_trends': baseline_trends,
    'dev_trends': dev_trends,
    'repr_products': repr_res,
}

with open(RESULTS_OUT, 'w') as f:
    json.dump(results, f, indent=2)

print('\nResults saved to', RESULTS_OUT)
print('DONE.')
