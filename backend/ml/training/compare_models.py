"""
Phase 7 & 8 – Model Comparison + 20-Product Business Validation
Run: python ml/training/compare_models.py   (from backend/)
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib, os, sys, json, urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "retail_price_optimization_dataset_fixed.csv")
sys.path.insert(0, os.path.dirname(BASE_DIR))

# ── 1. Load & compute target ────────────────────────────────────────────────
print("Loading data...")
df = pd.read_csv(DATA_PATH)

def calculate_optimal_price(row):
    current  = row["current_price"];  competitor = row["competitor_price"]
    demand   = row["demand_index"];   inventory  = row["inventory_level"]
    cost     = row["cost_price"];     promo      = row["promotion_type"]
    rating   = row["average_rating"]; lifecycle  = row["product_lifecycle"]
    season   = row["season"];         category   = row["category"]
    sales    = row["historical_sales"]
    opt = current
    if competitor > current * 1.05:  opt = current * 1.05
    elif competitor < current * 0.95: opt = current * 0.95
    if demand >= 80 and inventory <= 50: opt *= 1.05
    elif demand <= 40 and inventory >= 150: opt *= 0.95
    if opt < cost * 1.10: opt = cost * 1.10
    if lifecycle == "End of Life": opt *= 0.95
    elif lifecycle == "Introduction": opt *= 1.05
    if rating >= 4.5: opt *= 1.02
    elif rating < 3.0: opt *= 0.98
    if promo in ["Clearance", "Flash Sale"]: opt *= 0.90
    if season == "Winter" and category == "Apparel": opt *= 1.05
    if sales > 10000: opt *= 1.02
    elif sales < 7000: opt *= 0.98
    return opt

df["optimal_price"] = df.apply(calculate_optimal_price, axis=1)
y = df["optimal_price"] / df["current_price"]
DROP_COLS = ["optimal_price","product_id","product_name","product_model","date","current_price",
             "revenue","units_sold","price_change_pct","discount_pct","stockout_flag",
             "day_of_week","month","region","sales_channel"]
X = df.drop(columns=DROP_COLS)
categorical_columns = X.select_dtypes(include=["str","object"]).columns.tolist()

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
print(f"Train: {len(X_train):,}  Test: {len(X_test):,}")

def make_preprocessor():
    return ColumnTransformer(
        [('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_columns)],
        remainder='passthrough'
    )

def evaluate(y_true, y_pred, name):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(np.mean((y_true - y_pred)**2))
    r2   = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    print(f"  {name:20s} MAE={mae:.4f}  RMSE={rmse:.4f}  R²={r2:.4f}  MAPE={mape:.4f}%")
    return dict(name=name, mae=mae, rmse=rmse, r2=r2, mape=mape)

results = []

# ── 2. Linear Regression ─────────────────────────────────────────────────────
print("\n[1/3] Linear Regression...")
lr_pipe = Pipeline([('preprocessor', make_preprocessor()), ('model', LinearRegression())])
lr_pipe.fit(X_train, y_train)
results.append(evaluate(y_test, lr_pipe.predict(X_test), "Linear Regression"))

# ── 3. Random Forest ─────────────────────────────────────────────────────────
print("[2/3] Random Forest (100 trees)...")
rf_pipe = Pipeline([('preprocessor', make_preprocessor()),
                    ('model', RandomForestRegressor(n_estimators=100, max_depth=15,
                                                   min_samples_leaf=5, random_state=42, n_jobs=-1))])
rf_pipe.fit(X_train, y_train)
results.append(evaluate(y_test, rf_pipe.predict(X_test), "Random Forest"))

# ── 4. XGBoost (already saved) ───────────────────────────────────────────────
print("[3/3] XGBoost (loading saved pipeline)...")
xgb_pipe = joblib.load(os.path.join(BASE_DIR, "models", "optimal_price_pipeline.pkl"))
results.append(evaluate(y_test, xgb_pipe.predict(X_test), "XGBoost"))

# ── 5. Print comparison table ─────────────────────────────────────────────────
print("\n\n=== MODEL COMPARISON ===")
print(f"{'Model':<22} {'MAE':>8} {'RMSE':>8} {'R²':>8} {'MAPE':>10} {'Selected?':>10}")
print("-" * 72)
best_r2 = max(r['r2'] for r in results)
for r in results:
    selected = "[FINAL]" if r['r2'] == best_r2 else "[ ]"
    print(f"{r['name']:<22} {r['mae']:>8.4f} {r['rmse']:>8.4f} {r['r2']:>8.4f} {r['mape']:>9.4f}% {selected:>10}")

# ── 6. 20-Product Business Validation via live API ────────────────────────────
print("\n\n=== 20-PRODUCT BUSINESS VALIDATION (XGBoost API) ===")
df_latest = df.sort_values('date', ascending=False).drop_duplicates('product_id', keep='first')
sample = df_latest.sample(20, random_state=99)

passed = 0; failed = 0
for _, row in sample.iterrows():
    payload = json.dumps({
        "product_name": row["product_name"],
        "current_price": float(row["current_price"]),
        "demand_index": float(row["demand_index"]),
        "inventory_level": int(row["inventory_level"]),
        "competitor_price": float(row["competitor_price"]),
        "promotion_type": str(row["promotion_type"])
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/v1/predictions/predict-price",
            data=payload, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        diff = data["optimal_price"] - data["current_price"]
        pct  = (diff / data["current_price"]) * 100
        # Business rule check: optimal_price should never be below cost_price * 1.10
        cost_floor = float(row["cost_price"]) * 1.10
        status = "OK" if data["optimal_price"] >= cost_floor else "BELOW_COST_FLOOR"
        if status == "OK": passed += 1
        else: failed += 1
        print(f"  {'OK' if status=='OK' else 'FAIL'} {row['product_name'][:35]:<36}"
              f"  Current=Rs.{data['current_price']:>10,.2f}"
              f"  AI=Rs.{data['optimal_price']:>10,.2f}"
              f"  {'+' if diff>=0 else ''}{pct:+.2f}%"
              f"  [{data['recommendation'][:20]}]"
              f"  {status}")
    except Exception as e:
        failed += 1
        print(f"  ✗ {row['product_name'][:35]:<36}  ERROR: {e}")

print(f"\nValidation: {passed}/20 PASSED, {failed}/20 FAILED")
