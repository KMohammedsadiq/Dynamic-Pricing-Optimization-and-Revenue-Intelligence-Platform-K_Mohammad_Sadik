from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    product_name: str = Field(..., description="Product Name")
    brand: str = Field(..., description="Brand name")
    category: str = Field(..., description="Product category (e.g., Electronics, Apparel)")
    base_price: float = Field(..., description="Anchor price of the product", gt=0)
    cost_price: float = Field(..., description="Cost Price", ge=0)
    competitor_price: float = Field(..., description="Competitor Price", ge=0)
    demand_index: float = Field(..., description="Calculated demand metric", ge=0)
    inventory_level: int = Field(..., description="Current stock level", ge=0)
    promotion_type: str = Field(..., description="Promotion type (e.g., No Promotion, Percentage Discount)")
    season: str = Field(..., description="Season (e.g., Winter, Spring)")
    historical_sales: int = Field(..., description="Historical total sales", ge=0)
    average_rating: float = Field(..., description="Average Rating (0-5)", ge=0, le=5)
    product_lifecycle: str = Field(..., description="Product Lifecycle Phase")

from typing import Dict, Any, Optional

class ModelInfo(BaseModel):
    name: str
    version: str

class PredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    model: ModelInfo
    prediction_time: str
    input: Dict[str, Any]
    explanation: Optional[Dict[str, Any]] = None
