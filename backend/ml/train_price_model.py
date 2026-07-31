"""
PricePilot AI - Model Training Module
=====================================

This script serves as the main pipeline for training the price prediction
and demand forecasting models.
"""

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from preprocessing import prepare_training_data

def train_model(X_train, y_train):
    """Train the Linear Regression model."""
    print("Training Linear Regression model...")
    model = LinearRegression()
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test):
    """Evaluate the trained model."""
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Evaluation Metrics ---")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2:   {r2:.4f}")
    
    return mae, rmse, r2

def save_model(model, preprocessor, model_path="backend/ml/models/price_model.joblib", preprocessor_path="backend/ml/models/preprocessor.joblib"):
    """Save the trained model and preprocessor to disk."""
    print(f"\nSaving model to {model_path}...")
    joblib.dump(model, model_path)
    
    print(f"Saving preprocessor to {preprocessor_path}...")
    joblib.dump(preprocessor, preprocessor_path)

def run_training_pipeline():
    """Execute the full model training pipeline and save the artifact."""
    # 1. Load data and preprocessing pipeline
    X, y, preprocessor, X_processed = prepare_training_data()
    
    # 2. Train/Test split
    print("\nSplitting dataset (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)
    
    # 3. Train
    model = train_model(X_train, y_train)
    
    # 4. Evaluate
    mae, rmse, r2 = evaluate_model(model, X_test, y_test)
    
    # 5. Save
    save_model(model, preprocessor)
    
    print("\nTraining Pipeline Completed Successfully.")
    
    return mae, rmse, r2, len(X), X_processed.shape[1]

if __name__ == "__main__":
    run_training_pipeline()
