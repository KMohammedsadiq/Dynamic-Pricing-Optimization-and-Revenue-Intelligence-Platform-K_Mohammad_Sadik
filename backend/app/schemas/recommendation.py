from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class HistoricalSummary(BaseModel):
    matching_records: int
    average_price: Optional[float] = None
    highest_price: Optional[float] = None
    lowest_price: Optional[float] = None

class RecommendationResponse(BaseModel):
    predicted_price: float
    historical_average_price: Optional[float] = None
    price_difference: Optional[float] = None
    difference_percentage: Optional[float] = None
    currency: str
    recommendation: str
    reasons: List[str]
    historical_summary: Optional[HistoricalSummary] = None
    explanation: Optional[Dict[str, Any]] = None
    input: Optional[Dict[str, Any]] = None
