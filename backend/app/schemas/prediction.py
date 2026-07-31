from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    category: str = Field(..., description="Product category (e.g., Electronics, Apparel)")
    brand: str = Field(..., description="Brand name")
    region: str = Field(..., description="Region code (e.g., US, UK)")
    channel: str = Field(..., description="Sales channel (e.g., web, app)")
    season: str = Field(..., description="Season (e.g., Winter, Spring)")
    promotion_type: str = Field(..., description="Promotion type (e.g., No Promotion, Percentage Discount)")
    base_price: float = Field(..., description="Anchor price of the product", gt=0)
    inventory_level: int = Field(..., description="Current stock level", ge=0)
    stockout_flag: int = Field(..., description="0 for in-stock, 1 for stockout", ge=0, le=1)
    demand_index: float = Field(..., description="Calculated demand metric", ge=0)

from typing import Dict, Any

class ModelInfo(BaseModel):
    name: str
    version: str

class PredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    model: ModelInfo
    prediction_time: str
    input: Dict[str, Any]
