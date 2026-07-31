import joblib
import pandas as pd
import logging
import datetime
from fastapi import HTTPException

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PricePrediction")

# Global variables to hold the loaded model and preprocessor in memory
MODEL_PATH = "backend/ml/models/price_model.joblib"
PREPROCESSOR_PATH = "backend/ml/models/preprocessor.joblib"

# Load models once when the module is imported (FastAPI startup)
try:
    logger.info(f"[{datetime.datetime.now()}] Loading Machine Learning models into memory...")
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    logger.info(f"[{datetime.datetime.now()}] ML models loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load ML models: {e}")
    model = None
    preprocessor = None

def predict_price(input_data: dict) -> dict:
    """
    Given a dictionary of product/market data, return the prediction.
    """
    timestamp = datetime.datetime.now().isoformat()
    logger.info(f"[{timestamp}] Prediction request received. Input: {input_data}")
    
    if model is None or preprocessor is None:
        logger.error(f"[{timestamp}] Models are not loaded in memory.")
        raise HTTPException(status_code=500, detail="Machine Learning models are unavailable.")
    
    try:
        # 1. Convert input to DataFrame (must match the expected 10 features)
        # category, brand, region, channel, season, promotion_type
        # base_price, inventory_level, stockout_flag, demand_index
        df = pd.DataFrame([input_data])
        
        # Ensure correct column ordering based on training
        categorical_features = ['category', 'brand', 'region', 'channel', 'season', 'promotion_type']
        numerical_features = ['base_price', 'inventory_level', 'stockout_flag', 'demand_index']
        expected_cols = categorical_features + numerical_features
        
        # Fill missing expected columns with safe defaults if necessary (though API should validate)
        for col in categorical_features:
            if col not in df: df[col] = "Unknown"
        for col in numerical_features:
            if col not in df: df[col] = 0
            
        df = df[expected_cols]
        
        # 2. Transform the data using the loaded preprocessor
        X_processed = preprocessor.transform(df)
        
        # 3. Predict using the loaded model
        predicted_price = model.predict(X_processed)[0]
        
        # 4. Format Output
        response = {
            "model": "Linear Regression",
            "currency": "INR",
            "status": "Prediction generated successfully",
            "input": input_data,
            "predicted_price": round(predicted_price, 2)
        }
        
        logger.info(f"[{datetime.datetime.now().isoformat()}] Prediction successful: {response['predicted_price']}")
        return response
        
    except Exception as e:
        error_msg = f"Prediction failed during processing: {str(e)}"
        logger.error(f"[{datetime.datetime.now().isoformat()}] {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
