import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "retail_price_optimization_dataset_fixed.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "optimal_price_pipeline.pkl")

print(f"Loading data from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)

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

    if competitor > current * 1.05:
        opt = current * 1.05
    elif competitor < current * 0.95:
        opt = current * 0.95

    if demand >= 80 and inventory <= 50:
        opt *= 1.05
    elif demand <= 40 and inventory >= 150:
        opt *= 0.95

    if opt < cost * 1.10:
        opt = cost * 1.10

    if lifecycle == "End of Life":
        opt *= 0.95
    elif lifecycle == "Introduction":
        opt *= 1.05

    if rating >= 4.5:
        opt *= 1.02
    elif rating < 3.0:
        opt *= 0.98

    if promo in ["Clearance", "Flash Sale"]:
        opt *= 0.90
        
    if season == "Winter" and category == "Apparel":
        opt *= 1.05
        
    if sales > 10000:
        opt *= 1.02
    elif sales < 7000:
        opt *= 0.98

    return opt

if __name__ == "__main__":
    print("Calculating optimal prices...")
    df["optimal_price"] = df.apply(calculate_optimal_price, axis=1)

    y = df["optimal_price"] / df["current_price"]
    X = df.drop(columns=[
        "optimal_price", "product_id", "product_name", 
        "product_model", "date", "current_price",
        # Drop features unknowable at inference or contextual features not sent by UI
        "revenue", "units_sold", "price_change_pct", "discount_pct", "stockout_flag",
        "day_of_week", "month", "region", "sales_channel"
    ])

    print("Setting up pipeline...")
    categorical_columns = X.select_dtypes(include=["object"]).columns
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_columns)
        ],
        remainder='passthrough'
    )

    X_train,X_test,y_train,y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    rf_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', RandomForestRegressor(
            n_estimators=100, # Reduced to 100 for faster training here
            max_depth=15,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        ))
    ])

    print("Training Random Forest...")
    rf_pipeline.fit(X_train, y_train)

    print(f"Saving model to {MODEL_PATH}...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(rf_pipeline, MODEL_PATH)

    print("Done!")
