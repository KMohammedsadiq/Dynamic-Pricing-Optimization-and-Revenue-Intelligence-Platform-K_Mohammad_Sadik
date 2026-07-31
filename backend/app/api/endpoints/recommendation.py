from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest
from app.schemas.recommendation import RecommendationResponse
from app.services.business_recommendation_service import business_recommendation_service

router = APIRouter()

@router.post("/business-recommendation", response_model=RecommendationResponse)
def get_business_recommendation(request_data: PredictionRequest):
    """
    Returns an actionable business recommendation.
    Model is trained natively on INR data — all monetary values are returned directly in INR.
    """
    input_dict = request_data.model_dump()
    result = business_recommendation_service.get_recommendation(input_dict)

    # Mark currency — data is natively INR, no conversion needed
    result["currency"] = "INR"

    return result
