from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
def predict_price_endpoint(request_data: PredictionRequest, db: Session = Depends(get_db)):
    """
    Predict optimal product price using the trained XGBoost pipeline.
    Combines static DB product attributes with dynamic user input.
    """
    input_dict = request_data.model_dump()
    result = prediction_service.predict(db, input_dict)
    return result

# We also redirect /business-recommendation here to ensure only ONE prediction flow is used
@router.post("/business-recommendation", response_model=PredictionResponse)
def business_recommendation_endpoint(request_data: PredictionRequest, db: Session = Depends(get_db)):
    """
    Alias for /predict-price. Only one underlying ML flow is executed.
    """
    input_dict = request_data.model_dump()
    result = prediction_service.predict(db, input_dict)
    return result
