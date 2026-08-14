import os
import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import json
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OrdinalEncoder
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.getcwd()
DATA_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting_dev')
os.makedirs(MODELS_DIR, exist_ok=True)

FILL_FEAT_PATH = os.path.join(DATA_DIR, 'demand_forecasting_features_fill_dev.csv')
RESULTS_PATH = os.path.join(BASE_DIR, 'backend', 'ml', 'training', 'bias_correction_results.json')

HORIZONS = {'7d': 1, '14d': 2, '30d': 4, '90d': 13, '180d': 26, '365d': 52}
GENUINE_CUTOFF = pd.to_datetime('2026-08-10')
VAL_START_DATE = pd.to_datetime('2026-06-01') # Use recent genuine data for validation

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super(NpEncoder, self).default(obj)

print("1. Loading dataset and calculating targets...")
df = pd.read_csv(FILL_FEAT_PATH)
df['date_dt'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
df = df.sort_values(by=['product_id', 'date_dt'])

# Compute targets properly
for hz, w in HORIZONS.items():
    df[f'target_{hz}'] = df.groupby('product_id')['units_sold'].transform(
        lambda x: x.iloc[::-1].rolling(window=w, min_periods=w).sum().iloc[::-1].shift(-1)
    )

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
df[CAT_COLS] = enc.fit_transform(df[CAT_COLS].fillna('Missing'))

def smape(A, F):
    return 100/len(A) * np.sum(2 * np.abs(F - A) / (np.abs(A) + np.abs(F) + 1e-8))

def get_trend(pred, weeks, rolling):
    w = pred / weeks
    if rolling > 0:
        d = (w - rolling) / rolling
        if d > 0.05:    return 'Increasing'
        elif d < -0.05: return 'Decreasing'
        else:           return 'Stable'
    return 'Increasing' if w > 0 else 'Stable'

results = {'strategies': {}, 'products': {}}
STRATEGIES = ['A_Baseline', 'B_Weighted', 'C_Genuine']
REPR_PRODS = ['ACC001', 'ACC002', 'BOK501', 'ELE509', 'ACC014', 'TOY507', 'OFF503']

for strat in STRATEGIES:
    results['strategies'][strat] = {}

print("2. Training models...")
for hz, hz_w in HORIZONS.items():
    print(f"--- Horizon {hz} ---")
    target_col = f'target_{hz}'
    valid_df = df[df[target_col].notna()].copy()
    
    # Validation split: ONLY genuinely observed historical data
    # We will use data after VAL_START_DATE (June 2026) that is genuinely historical
    val_mask = (valid_df['date_dt'] >= VAL_START_DATE) & (valid_df['provenance_label'] == 'genuine_historical')
    val_df = valid_df[val_mask]
    
    train_df = valid_df[~val_mask]
    # Remove future observation leakage from training targets
    # If the target window reaches into genuine_future_observation, we should technically exclude it,
    # but the simplest proxy is removing training rows where provenance is genuine_future_observation.
    train_df = train_df[train_df['provenance_label'] != 'genuine_future_observation']
    
    if len(val_df) < 50:
        print(f"Not enough validation data for {hz}. Skip.")
        continue
        
    X_val = val_df[FINAL_FEATS].fillna(0)
    y_val = val_df[target_col]
    
    for strat in STRATEGIES:
        if strat == 'A_Baseline':
            # Current composition: all train_df, sample_weight=1
            curr_train = train_df.copy()
            weights = np.ones(len(curr_train))
        elif strat == 'B_Weighted':
            curr_train = train_df.copy()
            weights = np.ones(len(curr_train))
            # Lower synthetic weight, increase genuine weight
            # synthetic_historical: 0.1, genuine_historical: 5.0, synthetic_feature_fill: 0.1
            weights = np.where(curr_train['provenance_label'].isin(['synthetic_historical', 'synthetic_feature_fill']), 0.1, 5.0)
        elif strat == 'C_Genuine':
            curr_train = train_df[train_df['provenance_label'] == 'genuine_historical'].copy()
            weights = np.ones(len(curr_train))
            
        if len(curr_train) < 50:
            print(f"  {strat} - not enough train data.")
            continue
            
        X_tr = curr_train[FINAL_FEATS].fillna(0)
        y_tr = curr_train[target_col]
        
        mdl = xgb.XGBRegressor(
            n_estimators=100, learning_rate=0.05, max_depth=5, 
            random_state=42, n_jobs=-1
        )
        mdl.fit(X_tr, y_tr, sample_weight=weights)
        
        # Save model
        mdl_path = os.path.join(MODELS_DIR, f'dev_{hz}_{strat}.pkl')
        with open(mdl_path, 'wb') as f:
            pickle.load = pickle.dump(mdl, f)
            
        # Eval
        preds = np.maximum(0, mdl.predict(X_val))
        
        mae = mean_absolute_error(y_val, preds)
        rmse = np.sqrt(mean_squared_error(y_val, preds))
        r2 = r2_score(y_val, preds)
        smap = smape(y_val.values, preds)
        
        # Bias metrics on latest data (all products)
        latest_df = df[df['date_dt'] <= GENUINE_CUTOFF].groupby('product_id').last().reset_index()
        X_latest = latest_df[FINAL_FEATS].fillna(0)
        preds_latest = np.maximum(0, mdl.predict(X_latest))
        
        trends = {'Increasing':0, 'Stable':0, 'Decreasing':0}
        ratios = []
        extreme_growth = 0
        
        for idx, row in latest_df.iterrows():
            pred_w = preds_latest[idx] / hz_w
            r4w = row['rolling_4w_sales_mean']
            tr = get_trend(preds_latest[idx], hz_w, r4w)
            trends[tr] += 1
            if r4w > 0:
                ratio = pred_w / r4w
                ratios.append(ratio)
                if ratio > 1.5: extreme_growth += 1
                
        r_series = pd.Series(ratios).dropna()
        t_total = sum(trends.values())
        
        results['strategies'][strat][hz] = {
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2,
            'sMAPE': smap,
            'val_count': len(y_val),
            'unique_products': val_df['product_id'].nunique(),
            'bias_median_ratio': r_series.median() if not r_series.empty else None,
            'bias_p10': r_series.quantile(0.10) if not r_series.empty else None,
            'bias_p50': r_series.quantile(0.50) if not r_series.empty else None,
            'bias_p90': r_series.quantile(0.90) if not r_series.empty else None,
            'pct_increasing': trends['Increasing'] / t_total * 100,
            'pct_stable': trends['Stable'] / t_total * 100,
            'pct_decreasing': trends['Decreasing'] / t_total * 100,
            'pct_extreme_growth': extreme_growth / len(latest_df) * 100
        }
        
        # Repr products for 30d
        if hz == '30d':
            for pid in REPR_PRODS:
                p_row = latest_df[latest_df['product_id'] == pid]
                if p_row.empty: continue
                p_idx = p_row.index[0]
                p_pred_w = preds_latest[p_idx] / hz_w
                p_r4w = p_row['rolling_4w_sales_mean'].values[0]
                p_tr = get_trend(preds_latest[p_idx], hz_w, p_r4w)
                
                if pid not in results['products']: results['products'][pid] = {'rolling_4w': p_r4w}
                results['products'][pid][strat] = {
                    'pred_weekly': p_pred_w,
                    'trend': p_tr,
                    'diff_pct': ((p_pred_w - p_r4w) / p_r4w * 100) if p_r4w > 0 else 0
                }

with open(RESULTS_PATH, 'w') as f:
    json.dump(results, f, indent=2, cls=NpEncoder)

print("Done.")
