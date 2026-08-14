import pandas as pd
import numpy as np
import hashlib
import json

df_orig = pd.read_csv('backend/ml/data/demand_forecasting_dataset_final.csv')
df_orig['date_dt'] = pd.to_datetime(df_orig['date'], format='%d-%m-%Y')

df_ext = pd.read_csv('backend/ml/data/demand_forecasting_dataset_extended_dev.csv')
df_ext['date_dt'] = pd.to_datetime(df_ext['date'], format='%d-%m-%Y')

df_feat = pd.read_csv('backend/ml/data/demand_forecasting_features_dev.csv')
df_feat['date_dt'] = pd.to_datetime(df_feat['date'], format='%d-%m-%Y')

# 1. ACC001 deep dive
acc_orig = df_orig[(df_orig['product_id'] == 'ACC001')].sort_values('date_dt')
acc_ext = df_ext[(df_ext['product_id'] == 'ACC001') & (df_ext['provenance_label'] == 'synthetic_extension')].sort_values('date_dt')
acc_feat = df_feat[(df_feat['product_id'] == 'ACC001')].sort_values('date_dt')

print("=== ACC001 Deep Dive ===")
print("Original April 2026 obs:")
print(acc_orig[(acc_orig['date_dt'] >= '2026-04-01') & (acc_orig['date_dt'] < '2026-05-01')][['date_dt', 'units_sold', 'inventory_level']])

print("\nGenerated April-August obs:")
print(acc_ext[['date_dt', 'units_sold']])

q1_25_acc = acc_orig[(acc_orig['date_dt'].dt.year == 2025) & (acc_orig['date_dt'].dt.month <= 3)]['units_sold'].mean()
q1_26_acc = acc_orig[(acc_orig['date_dt'].dt.year == 2026) & (acc_orig['date_dt'].dt.month <= 3)]['units_sold'].mean()
growth_acc = np.clip(q1_26_acc / q1_25_acc if pd.notna(q1_25_acc) and q1_25_acc > 0 else 1.0, 0.5, 1.5)
print(f"\nACC001 Q1 2025 avg: {q1_25_acc:.2f}")
print(f"ACC001 Q1 2026 avg: {q1_26_acc:.2f}")
print(f"ACC001 Growth Factor: {growth_acc:.2f}")

print("\nACC001 2025 Seasonal Reference vs Generated (by week):")
for _, row in acc_ext.iterrows():
    week = row['date_dt'].isocalendar().week
    ref = acc_orig[(acc_orig['date_dt'].dt.year == 2025) & (acc_orig['date_dt'].isocalendar().week == week)]
    base_units = ref.iloc[0]['units_sold'] if not ref.empty else 'N/A'
    print(f"Date: {row['date_dt'].date()} (Week {week}) | 2025 Ref Units: {base_units} | Gen Units: {row['units_sold']}")

print("\nACC001 rolling_4w_sales_mean at generation end:")
acc_feat_ext = acc_feat[acc_feat['date_dt'] <= '2026-08-10']
print(acc_feat_ext.iloc[-1][['date_dt', 'units_sold', 'units_sold_lag_1', 'rolling_4w_sales_mean']])


# 2. 684 Products Investigation
max_dates = df_orig.groupby('product_id')['date_dt'].max()
stuck_prods = max_dates[max_dates < '2026-05-01'].index.tolist()

growth_factors = []
rolling_increases = []

for pid in stuck_prods:
    p_df = df_orig[df_orig['product_id'] == pid].sort_values('date_dt')
    q1_25 = p_df[(p_df['date_dt'].dt.year == 2025) & (p_df['date_dt'].dt.month <= 3)]['units_sold'].mean()
    q1_26 = p_df[(p_df['date_dt'].dt.year == 2026) & (p_df['date_dt'].dt.month <= 3)]['units_sold'].mean()
    
    # Calculate unclipped growth factor
    raw_growth = q1_26 / q1_25 if pd.notna(q1_25) and q1_25 > 0 else 1.0
    growth = np.clip(raw_growth, 0.5, 1.5)
    growth_factors.append(growth)
    
    # Rolling increase
    p_feat = df_feat[df_feat['product_id'] == pid].sort_values('date_dt')
    if not p_feat.empty:
        last_orig_dt = p_df['date_dt'].max()
        last_orig_rolling = p_feat[p_feat['date_dt'] == last_orig_dt]['rolling_4w_sales_mean'].values
        last_ext_rolling = p_feat[p_feat['date_dt'] <= '2026-08-10']['rolling_4w_sales_mean'].values[-1]
        
        if len(last_orig_rolling) > 0 and last_orig_rolling[0] > 0:
             rolling_increases.append(last_ext_rolling / last_orig_rolling[0])

print("\n=== 684 Products Investigation ===")
gf = np.array(growth_factors)
print(f"Growth Factor - Median: {np.median(gf):.2f}, Mean: {np.mean(gf):.2f}")
print(f"% at 0.5: {np.mean(gf == 0.5)*100:.1f}%")
print(f"% at 1.5: {np.mean(gf == 1.5)*100:.1f}%")

ri = np.array(rolling_increases)
print(f"% with >2x increase in rolling demand: {np.mean(ri > 2.0)*100:.1f}%")
print(f"% with >3x increase in rolling demand: {np.mean(ri > 3.0)*100:.1f}%")
print(f"% with >5x increase in rolling demand: {np.mean(ri > 5.0)*100:.1f}%")

gen_demand = df_ext[df_ext['provenance_label'] == 'synthetic_extension']['units_sold']
orig_demand = df_orig['units_sold']
print(f"Original Demand - Median: {orig_demand.median()}, Mean: {orig_demand.mean():.1f}")
print(f"Generated Demand - Median: {gen_demand.median()}, Mean: {gen_demand.mean():.1f}")


# 5. Alternative Scaling Methods (In-memory simulation for a sample of products)
print("\n=== Alternative Scaling Methods ===")

def simulate_scaling(method, pids_sample):
    results = []
    
    for pid in pids_sample:
        p_df = df_orig[df_orig['product_id'] == pid].sort_values('date_dt')
        latest = p_df.iloc[-1]
        latest_dt = latest['date_dt']
        target_dates = pd.date_range(start=latest_dt + pd.Timedelta(days=7), end=pd.to_datetime('2026-08-10'), freq='W-WED')
        
        q1_25 = p_df[(p_df['date_dt'].dt.year == 2025) & (p_df['date_dt'].dt.month <= 3)]['units_sold'].mean()
        q1_26 = p_df[(p_df['date_dt'].dt.year == 2026) & (p_df['date_dt'].dt.month <= 3)]['units_sold'].mean()
        raw_growth = q1_26 / q1_25 if pd.notna(q1_25) and q1_25 > 0 else 1.0
        
        if method == 'A': # Current Q1 growth
            growth = np.clip(raw_growth, 0.5, 1.5)
        elif method == 'B': # Capped growth (e.g. 0.8 to 1.2)
            growth = np.clip(raw_growth, 0.8, 1.2)
        elif method == 'C': # Recent 2026 vs 2025 ratio (last 8 weeks before cutoff)
            recent_26 = p_df.tail(8)['units_sold'].mean()
            recent_weeks = p_df.tail(8)['date_dt'].dt.isocalendar().week
            recent_25 = p_df[(p_df['date_dt'].dt.year == 2025) & (p_df['date_dt'].dt.isocalendar().week.isin(recent_weeks))]['units_sold'].mean()
            recent_growth = recent_26 / recent_25 if pd.notna(recent_25) and recent_25 > 0 else 1.0
            growth = np.clip(recent_growth, 0.8, 1.2)
        elif method == 'D': # Blended: 50% recent mean, 50% seasonal ref
             pass # Handled in loop
             
        gen_units = []
        recent_mean = p_df.tail(4)['units_sold'].mean()
        
        for dt in target_dates:
            week = dt.isocalendar().week
            ref = p_df[(p_df['date_dt'].dt.year == 2025) & (p_df['date_dt'].dt.isocalendar().week == week)]
            base_units = ref.iloc[0]['units_sold'] if not ref.empty else recent_mean
            
            if method == 'D':
                units = (0.5 * base_units) + (0.5 * recent_mean)
                # update recent mean
                recent_mean = (recent_mean * 3 + units) / 4
            else:
                units = base_units * growth
                
            gen_units.append(units)
            
        
        orig_mean = p_df['units_sold'].mean()
        gen_mean = np.mean(gen_units) if gen_units else 0
        
        results.append({
            'pid': pid,
            'orig_mean': orig_mean,
            'gen_mean': gen_mean,
            'growth_ratio': gen_mean / orig_mean if orig_mean > 0 else 1.0,
            'gen_max': np.max(gen_units) if gen_units else 0
        })
    
    res_df = pd.DataFrame(results)
    print(f"Method {method}:")
    print(f"  Avg Gen Demand: {res_df['gen_mean'].mean():.1f}")
    print(f"  Max Gen Demand across products: {res_df['gen_max'].max():.1f}")
    print(f"  Avg Growth Ratio (Gen/Orig): {res_df['growth_ratio'].mean():.2f}")
    print(f"  Products > 2x orig mean: {np.sum(res_df['growth_ratio'] > 2.0)}")

sample_pids = np.random.choice(stuck_prods, 100, replace=False)
simulate_scaling('A', sample_pids)
simulate_scaling('B', sample_pids)
simulate_scaling('C', sample_pids)
simulate_scaling('D', sample_pids)
