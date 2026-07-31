from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service

from app.services.currency_service import currency_service

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
def predict_price_endpoint(request_data: PredictionRequest):
    """
    Predict optimal product price using the trained Machine Learning model.
    Converts USD prediction to INR for frontend presentation.
    """
    # Convert Pydantic model to dict
    input_dict = request_data.model_dump()
    
    # Run prediction service (outputs USD)
    result = prediction_service.predict(input_dict)
    
    # Convert to INR at the presentation layer
    result["predicted_price"] = currency_service.convert_to_inr(result["predicted_price"])
    result["currency"] = "INR"
    
    return result
