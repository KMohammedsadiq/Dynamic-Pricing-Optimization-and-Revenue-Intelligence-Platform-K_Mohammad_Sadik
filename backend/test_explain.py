import os
import sys
import joblib
import pandas as pd

# Path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "app", "models", "price_model.joblib")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "app", "models", "preprocessor.joblib")

# Assuming models are actually in ml/models/ based on prediction_service.py
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "price_model.joblib")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "ml", "models", "preprocessor.joblib")

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

input_data = {
    "category": "Electronics",
    "brand": "Samsung",
    "region": "IN",
    "channel": "Web",
    "season": "Winter",
    "promotion_type": "No Promotion",
    "base_price": 25000,
    "inventory_level": 200,
    "stockout_flag": 0,
    "demand_index": 120
}

df = pd.DataFrame([input_data])
categorical_features = ['category', 'brand', 'region', 'channel', 'season', 'promotion_type']
numerical_features = ['base_price', 'inventory_level', 'stockout_flag', 'demand_index']
df = df[categorical_features + numerical_features]

X_processed = preprocessor.transform(df)

if hasattr(X_processed, 'toarray'):
    x_val = X_processed.toarray()[0]
else:
    x_val = X_processed[0]

cat_feature_names = preprocessor.named_transformers_["cat"].get_feature_names_out(categorical_features)
all_feature_names = list(cat_feature_names) + numerical_features

contributions = x_val * model.coef_

contrib_df = pd.DataFrame({
    'Feature': all_feature_names,
    'Value': x_val,
    'Coefficient': model.coef_,
    'Contribution': contributions
})

# Filter out features that have 0 value (e.g. inactive one-hot columns)
active_features = contrib_df[contrib_df['Value'] != 0].copy()
active_features = active_features.sort_values(by='Contribution', ascending=False)

print("Intercept:", model.intercept_)
print("Top Positive Contributors:")
print(active_features[active_features['Contribution'] > 0].head(3))
print("\nTop Negative Contributors:")
print(active_features[active_features['Contribution'] < 0].tail(3))
