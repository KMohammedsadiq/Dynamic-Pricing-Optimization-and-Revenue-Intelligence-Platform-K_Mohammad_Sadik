from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class CompetitorProduct(BaseModel):
    competitor_name: str
    product_name: str
    brand: Optional[str]
    category: Optional[str]
    price: float
    currency: str
    availability: str
    product_url: str
    image_url: Optional[str]
    scraped_at: datetime
