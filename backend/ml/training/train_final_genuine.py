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
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting')
DEV_MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml', 'models', 'demand_forecasting_dev')
os.makedirs(DEV_MODELS_DIR, exist_ok=True)

FILL_FEAT_PATH = os.path.join(DATA_DIR, 'demand_forecasting_features_fill_dev.csv')
RESULTS_PATH = os.path.join(BASE_DIR, 'backend', 'ml', 'training', 'final_validation_results.json')

HORIZONS = {'7d': 1, '14d': 2, '30d': 4, '90d': 13, '180d': 26, '365d': 52}
PROD_BEST = {'7d': 'target_7d_Fold_4.pkl', '14d': 'target_14d_Fold_4.pkl', '30d': 'target_30d_Fold_4.pkl', 
             '90d': 'target_90d_Fold_3.pkl', '180d': 'target_180d_Fold_3.pkl'}
GENUINE_CUTOFF = pd.to_datetime('2026-08-10')
VAL_START_DATE = pd.to_datetime('2026-06-01')

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

results = {}
REPR_PRODS = ['ACC001', 'ACC002', 'BOK501', 'ELE509', 'ACC014', 'TOY507', 'OFF503']

print("2. Training Genuine-Only models & Evaluating against Production...")
for hz, hz_w in HORIZONS.items():
    print(f"--- Horizon {hz} ---")
    target_col = f'target_{hz}'
    valid_df = df[df[target_col].notna()].copy()
    
    # Strictly chronological validation
    val_mask = (valid_df['date_dt'] >= VAL_START_DATE) & (valid_df['provenance_label'] == 'genuine_historical')
    val_df = valid_df[val_mask]
    
    train_mask = (valid_df['date_dt'] < VAL_START_DATE) & (valid_df['provenance_label'] == 'genuine_historical')
    train_df = valid_df[train_mask]
    
    if len(val_df) < 20:
        print(f"Not enough validation data for {hz}. Rows: {len(val_df)}. Skip.")
        results[hz] = {'status': 'Insufficient validation data'}
        continue
        
    X_val = val_df[FINAL_FEATS].fillna(0)
    y_val = val_df[target_col]
    
    # 2a. Evaluate Production Model
    prod_metrics = None
    if hz in PROD_BEST:
        prod_mdl_path = os.path.join(MODELS_DIR, PROD_BEST[hz])
        if os.path.exists(prod_mdl_path):
            with open(prod_mdl_path, 'rb') as f:
                prod_mdl = pickle.load(f)
            prod_preds = np.maximum(0, prod_mdl.predict(X_val))
            prod_mae = mean_absolute_error(y_val, prod_preds)
            prod_rmse = np.sqrt(mean_squared_error(y_val, prod_preds))
            prod_r2 = r2_score(y_val, prod_preds)
            prod_smap = smape(y_val.values, prod_preds)
            prod_metrics = {'MAE': prod_mae, 'RMSE': prod_rmse, 'R2': prod_r2, 'sMAPE': prod_smap}
    
    # 2b. Train & Evaluate Genuine-Only Model
    if len(train_df) < 50:
        print(f"Not enough train data for {hz}. Rows: {len(train_df)}. Skip.")
        results[hz] = {'status': 'Insufficient train data'}
        continue
        
    X_tr = train_df[FINAL_FEATS].fillna(0)
    y_tr = train_df[target_col]
    
    dev_mdl = xgb.XGBRegressor(
        n_estimators=100, learning_rate=0.05, max_depth=5, 
        random_state=42, n_jobs=-1
    )
    dev_mdl.fit(X_tr, y_tr)
    
    # Save dev model
    dev_mdl_path = os.path.join(DEV_MODELS_DIR, f'genuine_{hz}.pkl')
    with open(dev_mdl_path, 'wb') as f:
        pickle.dump(dev_mdl, f)
        
    dev_preds = np.maximum(0, dev_mdl.predict(X_val))
    dev_mae = mean_absolute_error(y_val, dev_preds)
    dev_rmse = np.sqrt(mean_squared_error(y_val, dev_preds))
    dev_r2 = r2_score(y_val, dev_preds)
    dev_smap = smape(y_val.values, dev_preds)
    
    # Bias metrics on latest data (all products)
    latest_df = df[df['date_dt'] <= GENUINE_CUTOFF].groupby('product_id').last().reset_index()
    X_latest = latest_df[FINAL_FEATS].fillna(0)
    
    preds_latest_prod = np.maximum(0, prod_mdl.predict(X_latest)) if prod_metrics else np.zeros(len(latest_df))
    preds_latest_dev = np.maximum(0, dev_mdl.predict(X_latest))
    
    def calc_bias(preds_arr):
        trends = {'Increasing':0, 'Stable':0, 'Decreasing':0}
        ratios = []
        
        for idx, row in latest_df.iterrows():
            pred_w = preds_arr[idx] / hz_w
            r4w = row['rolling_4w_sales_mean']
            tr = get_trend(preds_arr[idx], hz_w, r4w)
            trends[tr] += 1
            if r4w > 0:
                ratios.append(pred_w / r4w)
                
        r_series = pd.Series(ratios).dropna()
        t_total = sum(trends.values())
        return {
            'bias_median': r_series.median() if not r_series.empty else None,
            'bias_p10': r_series.quantile(0.10) if not r_series.empty else None,
            'bias_p50': r_series.quantile(0.50) if not r_series.empty else None,
            'bias_p90': r_series.quantile(0.90) if not r_series.empty else None,
            'pct_increasing': trends['Increasing'] / t_total * 100 if t_total > 0 else 0,
            'pct_stable': trends['Stable'] / t_total * 100 if t_total > 0 else 0,
            'pct_decreasing': trends['Decreasing'] / t_total * 100 if t_total > 0 else 0
        }
        
    dev_bias = calc_bias(preds_latest_dev)
    prod_bias = calc_bias(preds_latest_prod) if prod_metrics else None

    # Repr products
    repr_results = {}
    for pid in REPR_PRODS:
        p_row = latest_df[latest_df['product_id'] == pid]
        if p_row.empty: continue
        p_idx = p_row.index[0]
        
        p_r4w = p_row['rolling_4w_sales_mean'].values[0]
        
        dev_pred_w = preds_latest_dev[p_idx] / hz_w
        dev_tr = get_trend(preds_latest_dev[p_idx], hz_w, p_r4w)
        
        prod_pred_w = preds_latest_prod[p_idx] / hz_w if prod_metrics else 0
        prod_tr = get_trend(preds_latest_prod[p_idx], hz_w, p_r4w) if prod_metrics else 'Unknown'
        
        repr_results[pid] = {
            'rolling_4w': p_r4w,
            'prod_pred': prod_pred_w,
            'prod_trend': prod_tr,
            'dev_pred': dev_pred_w,
            'dev_trend': dev_tr
        }

    results[hz] = {
        'status': 'OK',
        'val_count': len(y_val),
        'val_products': val_df['product_id'].nunique(),
        'val_date_min': str(val_df['date_dt'].min().date()),
        'val_date_max': str(val_df['date_dt'].max().date()),
        'prod_metrics': prod_metrics,
        'dev_metrics': {'MAE': dev_mae, 'RMSE': dev_rmse, 'R2': dev_r2, 'sMAPE': dev_smap},
        'prod_bias': prod_bias,
        'dev_bias': dev_bias,
        'repr_products': repr_results
    }

with open(RESULTS_PATH, 'w') as f:
    json.dump(results, f, indent=2, cls=NpEncoder)

print("Final validation completed. Results saved.")
