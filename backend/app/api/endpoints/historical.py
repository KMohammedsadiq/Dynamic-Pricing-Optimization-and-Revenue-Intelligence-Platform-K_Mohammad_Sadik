from fastapi import APIRouter
from app.schemas.historical import HistoricalPriceRequest, HistoricalPriceResponse
from app.services.historical_price_service import historical_price_service

from app.services.currency_service import currency_service

router = APIRouter()

@router.post("/historical-price-analysis", response_model=HistoricalPriceResponse)
def analyze_historical_price(request_data: HistoricalPriceRequest):
    """
    Analyzes historical pricing records and converts results to INR.
    """
    
    # Run analysis service (outputs USD)
    result = historical_price_service.analyze(
        category=request_data.category,
        brand=request_data.brand,
        region=request_data.region,
        season=request_data.season,
        base_price=request_data.base_price
    )
    
    # Convert monetary fields to INR
    if result.get("matching_records", 0) > 0:
        result["average_price"] = currency_service.convert_to_inr(result.get("average_price"))
        result["highest_price"] = currency_service.convert_to_inr(result.get("highest_price"))
        result["lowest_price"] = currency_service.convert_to_inr(result.get("lowest_price"))
        result["median_price"] = currency_service.convert_to_inr(result.get("median_price"))
        
        # Standard deviation scales linearly with currency multiplier
        result["price_std_dev"] = currency_service.convert_to_inr(result.get("price_std_dev"))
        
    return result
