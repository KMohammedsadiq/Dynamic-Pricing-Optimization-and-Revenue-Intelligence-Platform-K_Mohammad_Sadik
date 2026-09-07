from pydantic import BaseModel, Field
from typing import Optional

class HistoricalPriceRequest(BaseModel):
    product_name: str = Field(..., description="Product name to match")
    product_model: str = Field(..., description="Product model to match")
    category: str = Field(..., description="Product category to match")
    brand: str = Field(..., description="Brand name to match")
    region: str = Field(..., description="Region code to match")
    season: str = Field(..., description="Season to match")
    base_price: float = Field(..., description="Base price of the product to create a price band")

class HistoricalPriceResponse(BaseModel):
    matching_records: int
    match_level: Optional[str] = None
    average_price: Optional[float] = None
    highest_price: Optional[float] = None
    lowest_price: Optional[float] = None
    median_price: Optional[float] = None
    price_std_dev: Optional[float] = None
    average_demand_index: Optional[float] = None
    average_inventory: Optional[float] = None
    most_common_promotion: Optional[str] = None
    most_common_channel: Optional[str] = None
    message: Optional[str] = None
