import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib
import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "retail_price_optimization_dataset_cleaned_expanded.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "optimal_price_pipeline.pkl")

print(f"Loading data from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)

def calculate_optimal_price(row):
    """Business rule engine v2 – covers all known promotion types."""
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

    # Competitor price anchor
    if competitor > current * 1.05:
        opt = current * 1.05
    elif competitor < current * 0.95:
        opt = current * 0.95

    # Demand × Inventory interaction
    if demand >= 80 and inventory <= 50:
        opt *= 1.05
    elif demand <= 40 and inventory >= 150:
        opt *= 0.95

    # Cost floor (always enforce before applying promotions)
    if opt < cost * 1.10:
        opt = cost * 1.10

    # Lifecycle multiplier
    if lifecycle == "End of Life":
        opt *= 0.95
    elif lifecycle == "Introduction":
        opt *= 1.05

    # Rating adjustment
    if rating >= 4.5:
        opt *= 1.02
    elif rating < 3.0:
        opt *= 0.98

    # ── Promotion multipliers (ALL types) ────────────────────────────────────
    # Promotions ALWAYS apply AFTER demand/competitor adjustments so the model
    # learns that promotional discounts create downward pressure even when
    # other factors push the price up.
    if promo == "Clearance":
        opt *= 0.90          # Hard markdown – deepest discount
    elif promo == "Flash Sale":
        opt *= 0.92          # Time-limited flash – slightly less aggressive
    elif promo == "Festival Offer":
        opt *= 0.95          # Festival discount – mild price reduction
    elif promo == "Percentage Discount":
        opt *= 0.97          # Small % off – modest downward pressure
    elif promo == "Buy One Get One":
        opt *= 0.96          # BOGO reduces effective unit price
    elif promo == "Member Offer":
        opt *= 0.98          # Loyalty reward – very mild reduction
    # No Promotion → no adjustment

    # Seasonal category bonus
    if season == "Winter" and category == "Apparel":
        opt *= 1.05

    # Historical sales momentum
    if sales > 10000:
        opt *= 1.02
    elif sales < 7000:
        opt *= 0.98

    return opt

if __name__ == "__main__":
    # ── Inject Festival Offer rows ────────────────────────────────────────────
    # The original dataset has no "Festival Offer" rows. We synthesize them by
    # duplicating existing rows and setting promotion_type = "Festival Offer".
    # The business rule (×0.95) then generates the correct target label.
    print("Injecting Festival Offer training samples...")
    festival_base = df.sample(frac=0.06, random_state=7)   # ~6% of dataset ~10k rows
    festival_rows = festival_base.copy()
    festival_rows["promotion_type"] = "Festival Offer"
    df = pd.concat([df, festival_rows], ignore_index=True)
    print(f"  Festival Offer rows added: {len(festival_rows):,}  |  Total rows: {len(df):,}")

    print("Calculating optimal prices from business logic...")
    df["optimal_price"] = df.apply(calculate_optimal_price, axis=1)

    # Target variable: price multiplier
    y = df["optimal_price"] / df["current_price"]

    # Drop features unavailable at inference time
    X = df.drop(columns=[
        "optimal_price", "product_id", "product_name",
        "product_model", "date", "current_price",
        "revenue", "units_sold", "price_change_pct", "discount_pct",
        "stockout_flag", "day_of_week", "month", "region", "sales_channel"
    ])

    print(f"Training features ({len(X.columns)}): {list(X.columns)}")
    print(f"Unique promotion types in training: {sorted(X['promotion_type'].unique())}")

    # 80/20 split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    print(f"Train size: {len(X_train):,}  |  Test size: {len(X_test):,}")


    # Preprocessing: encode categoricals
    categorical_columns = X.select_dtypes(include=["object"]).columns.tolist()
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_columns)
        ],
        remainder='passthrough'
    )

    # XGBoost pipeline with tuned production parameters
    xgb_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', XGBRegressor(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=6,
            min_child_weight=3,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            verbosity=1,
            n_jobs=-1
        ))
    ])

    print("Training XGBoost pipeline...")
    xgb_pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = xgb_pipeline.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(np.mean((y_test - y_pred) ** 2))
    r2   = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

    print("\n--- XGBoost Model Evaluation ---")
    print(f"MAE  : {mae:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"R²   : {r2:.4f}")
    print(f"MAPE : {mape:.4f}%")

    # Feature importances
    rf_model = xgb_pipeline.named_steps['model']
    prep     = xgb_pipeline.named_steps['preprocessor']
    cat_names = prep.named_transformers_['cat'].get_feature_names_out(categorical_columns)
    num_cols  = [c for c in X.columns if c not in categorical_columns]
    all_feat_names = list(cat_names) + num_cols
    fi_vals = rf_model.feature_importances_
    fi = sorted(zip(all_feat_names, fi_vals), key=lambda x: x[1], reverse=True)
    print("\nTop 15 Feature Importances:")
    for name, imp in fi[:15]:
        print(f"  {name}: {imp:.4f}")

    print(f"\nSaving XGBoost pipeline to {MODEL_PATH}...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(xgb_pipeline, MODEL_PATH)
    print("Done! XGBoost pipeline saved successfully.")
