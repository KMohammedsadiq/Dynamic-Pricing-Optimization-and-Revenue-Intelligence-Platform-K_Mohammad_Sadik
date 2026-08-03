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
            allowed_features = [
                'product_name', 'brand', 'category', 'base_price', 'cost_price',
                'competitor_price', 'demand_index', 'inventory_level', 'promotion_type',
                'season', 'historical_sales', 'average_rating', 'product_lifecycle'
            ]
            df = df[allowed_features]
            
            # 3. Transform and predict
            X_processed = self.preprocessor.transform(df)
            predicted_price = self.model.predict(X_processed)[0]
            
            explanation = self._generate_explanation(X_processed)
            
            return {
                "predicted_price": round(predicted_price, 2),
                "currency": "INR",
                "model": {
                    "name": "Linear Regression",
                    "version": "v1.0"
                },
                "prediction_time": __import__('datetime').datetime.now().isoformat(),
                "input": input_data,
                "explanation": explanation
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise HTTPException(status_code=400, detail=f"Prediction failed. Verify input data. Error: {str(e)}")

    def _generate_explanation(self, X_processed):
        try:
            feature_names = self.preprocessor.get_feature_names_out()
            coefs = self.model.coef_
            
            if hasattr(X_processed, "toarray"):
                X_processed_dense = X_processed.toarray()[0]
            else:
                X_processed_dense = X_processed[0]
                
            contributions = X_processed_dense * coefs
            
            feature_contributions = []
            for name, cont in zip(feature_names, contributions):
                clean_name = name.replace("cat__", "").replace("num__", "")
                if "_" in clean_name and not clean_name.startswith("product_"):
                    clean_name = clean_name.replace("_", " ").title()
                if cont != 0:
                    feature_contributions.append((clean_name, cont))
                    
            feature_contributions.sort(key=lambda x: x[1], reverse=True)
            
            top_positive = [{"feature": f[0], "impact": round(float(f[1]), 2)} for f in feature_contributions[:3] if f[1] > 0]
            top_negative = [{"feature": f[0], "impact": round(float(f[1]), 2)} for f in feature_contributions[-3:] if f[1] < 0]
            top_negative.sort(key=lambda x: x["impact"])
            
            return {
                "top_positive_factors": top_positive,
                "top_negative_factors": top_negative,
                "business_summary": "The prediction is heavily influenced by the highlighted factors above. Strong demand or premium brand positioning typically increases the recommended price, while high inventory levels or heavy competition typically drive it down.",
                "confidence_r2": 0.9964,
                "disclaimer": "This is a recommendation based on historical data and learned patterns. Always review with business context."
            }
        except Exception as e:
            logger.error(f"Failed to generate explanation: {e}")
            return None

# Create a singleton instance so it loads only once during startup
prediction_service = PredictionService()
