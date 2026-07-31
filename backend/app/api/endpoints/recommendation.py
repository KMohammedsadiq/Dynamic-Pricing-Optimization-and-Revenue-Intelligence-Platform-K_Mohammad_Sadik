from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest
from app.schemas.recommendation import RecommendationResponse
from app.services.business_recommendation_service import business_recommendation_service

from app.services.currency_service import currency_service

router = APIRouter()

@router.post("/business-recommendation", response_model=RecommendationResponse)
def get_business_recommendation(request_data: PredictionRequest):
    """
    Returns an actionable business recommendation and converts monetary fields to INR.
    """
    input_dict = request_data.model_dump()
    result = business_recommendation_service.get_recommendation(input_dict)
    
    # Convert monetary fields to INR for presentation
    result["currency"] = "INR"
    result["predicted_price"] = currency_service.convert_to_inr(result.get("predicted_price"))
    
    if result.get("historical_average_price") is not None:
        result["historical_average_price"] = currency_service.convert_to_inr(result.get("historical_average_price"))
        result["price_difference"] = currency_service.convert_to_inr(result.get("price_difference"))
        
        # historical_summary inner dict
        summary = result.get("historical_summary", {})
        if summary:
            summary["average_price"] = currency_service.convert_to_inr(summary.get("average_price"))
            summary["highest_price"] = currency_service.convert_to_inr(summary.get("highest_price"))
            summary["lowest_price"] = currency_service.convert_to_inr(summary.get("lowest_price"))
            
    return result
