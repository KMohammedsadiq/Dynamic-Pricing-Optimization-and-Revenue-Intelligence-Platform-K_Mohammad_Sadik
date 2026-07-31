import joblib
import pandas as pd
import logging
from fastapi import HTTPException
import os

logger = logging.getLogger("PricePrediction")

# Build absolute paths relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "price_model.joblib")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "ml", "models", "preprocessor.joblib")

class PredictionService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self._load_models()

    def _load_models(self):
        try:
            logger.info("Loading ML models into memory...")
            self.model = joblib.load(MODEL_PATH)
            self.preprocessor = joblib.load(PREPROCESSOR_PATH)
            logger.info("ML models loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")

    def predict(self, input_data: dict) -> dict:
        if self.model is None or self.preprocessor is None:
            raise HTTPException(status_code=500, detail="Machine Learning models are unavailable.")
        
        try:
            # 1. Convert input to DataFrame
            df = pd.DataFrame([input_data])
            
            # 2. Ensure ordering matches training
            categorical_features = ['category', 'brand', 'region', 'channel', 'season', 'promotion_type']
            numerical_features = ['base_price', 'inventory_level', 'stockout_flag', 'demand_index']
            expected_cols = categorical_features + numerical_features
            df = df[expected_cols]
            
            # 3. Transform and predict
            X_processed = self.preprocessor.transform(df)
            predicted_price = self.model.predict(X_processed)[0]
            
            return {
                "predicted_price": round(predicted_price, 2),
                "currency": "INR",
                "model": {
                    "name": "Linear Regression",
                    "version": "v1.0"
                },
                "prediction_time": __import__('datetime').datetime.now().isoformat(),
                "input": input_data
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise HTTPException(status_code=400, detail=f"Prediction failed. Verify input data. Error: {str(e)}")

# Create a singleton instance so it loads only once during startup
prediction_service = PredictionService()
