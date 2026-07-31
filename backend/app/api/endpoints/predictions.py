from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
def predict_price_endpoint(request_data: PredictionRequest):
    """
    Predict optimal product price using the trained Machine Learning model.
    Model is trained natively on INR data — prices are returned directly in INR.
    """
    input_dict = request_data.model_dump()

    # Run prediction service — outputs native INR (no conversion required)
    result = prediction_service.predict(input_dict)
    result["currency"] = "INR"

    return result
