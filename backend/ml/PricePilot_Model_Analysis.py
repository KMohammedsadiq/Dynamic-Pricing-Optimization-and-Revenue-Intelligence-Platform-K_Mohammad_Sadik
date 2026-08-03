import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Set plot style
plt.style.use("default")
sns.set_theme(style="whitegrid")


# Define file path
dataset_path = "data/retail_pricing_demand_final.csv"

# Load the dataset
df = pd.read_csv(dataset_path)

# Normalize column name (matching preprocessing.py)
if "sales_channel" in df.columns and "channel" not in df.columns:
    df.rename(columns={"sales_channel": "channel"}, inplace=True)

# Impute missing values
df["promotion_type"] = df["promotion_type"].fillna("No Promotion")

print(f"Dataset loaded successfully with {len(df)} rows and {len(df.columns)} columns.")
df.head()


categorical_features = ["category", "brand", "region", "channel", "season", "promotion_type", "supplier_name", "product_name", "product_model", "product_lifecycle"]
numerical_features = ["base_price", "inventory_level", "stockout_flag", "demand_index", "cost_price", "competitor_price", "average_rating", "review_count", "historical_sales", "profit_margin", "launch_year", "days_since_launch"]
target = "current_price"

X = df[categorical_features + numerical_features]
y = df[target]

print("Features (X) shape:", X.shape)
print("Target (y) shape:", y.shape)


preprocessor_path = "models/preprocessor.joblib"
model_path = "models/price_model.joblib"

# Load preprocessor
preprocessor = joblib.load(preprocessor_path)
print("Preprocessor loaded successfully.")

# Load model
model = joblib.load(model_path)
print("Trained model loaded successfully.")


# Apply preprocessing
X_processed = preprocessor.transform(X)
print("Processed features shape:", X_processed.shape)

# Split into train and test sets (80/20 split, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)

print("Test set features shape:", X_test.shape)
print("Test set target shape:", y_test.shape)


# Generate predictions
y_pred = model.predict(X_test)

# Calculate metrics
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("--- Evaluation Metrics ---")
print(f"MAE (Mean Absolute Error): ₹ {mae:,.2f}")
print(f"RMSE (Root Mean Squared Error): ₹ {rmse:,.2f}")
print(f"R² Score: {r2:.4f}")


plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.3, color="blue")
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], "r--", lw=2)
plt.title("Actual vs. Predicted Prices", fontsize=14)
plt.xlabel("Actual Price (₹)", fontsize=12)
plt.ylabel("Predicted Price (₹)", fontsize=12)
plt.show()


residuals = y_test - y_pred

plt.figure(figsize=(10, 6))
plt.scatter(y_pred, residuals, alpha=0.3, color="purple")
plt.axhline(y=0, color="r", linestyle="--", lw=2)
plt.title("Residual Plot", fontsize=14)
plt.xlabel("Predicted Price (₹)", fontsize=12)
plt.ylabel("Residuals (Actual - Predicted)", fontsize=12)
plt.show()


plt.figure(figsize=(10, 6))
sns.histplot(residuals, bins=50, kde=True, color="teal")
plt.title("Error Distribution", fontsize=14)
plt.xlabel("Prediction Error (₹)", fontsize=12)
plt.ylabel("Frequency", fontsize=12)
plt.show()


if hasattr(model, "coef_"):
    # Get feature names from the preprocessor
    cat_feature_names = preprocessor.named_transformers_["cat"].get_feature_names_out(categorical_features)
    all_feature_names = list(cat_feature_names) + numerical_features
    
    # Create a DataFrame for coefficients
    coef_df = pd.DataFrame({"Feature": all_feature_names, "Coefficient": model.coef_})
    
    # Sort by absolute value of coefficient
    coef_df["Abs_Coefficient"] = coef_df["Coefficient"].abs()
    coef_df = coef_df.sort_values(by="Abs_Coefficient", ascending=False).head(15) # Top 15 features
    
    plt.figure(figsize=(12, 8))
    sns.barplot(x="Coefficient", y="Feature", data=coef_df, palette="viridis")
    plt.title("Top 15 Feature Coefficients (Impact on Price)", fontsize=14)
    plt.xlabel("Coefficient Value", fontsize=12)
    plt.ylabel("Feature", fontsize=12)
    plt.show()
else:
    print("The model does not have coefficients (not a linear model).")


