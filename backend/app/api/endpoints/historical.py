from fastapi import APIRouter
from app.schemas.historical import HistoricalPriceRequest, HistoricalPriceResponse
from app.services.historical_price_service import historical_price_service

router = APIRouter()

@router.post("/historical-price-analysis", response_model=HistoricalPriceResponse)
def analyze_historical_price(request_data: HistoricalPriceRequest):
    """
    Analyzes historical pricing records.
    Dataset is natively in INR — all prices returned directly in INR without conversion.
    """
    result = historical_price_service.analyze(
        category=request_data.category,
        brand=request_data.brand,
        region=request_data.region,
        season=request_data.season,
        base_price=request_data.base_price
    )

    return result
