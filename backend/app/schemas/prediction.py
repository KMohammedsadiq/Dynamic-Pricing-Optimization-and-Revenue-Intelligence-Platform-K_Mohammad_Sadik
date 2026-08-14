from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class PredictionRequest(BaseModel):
    is_new_product: bool = Field(False, description="Flag indicating if this is a new product manual entry")
    product_name: str = Field(..., description="Product Name to fetch or use as new product name")
    
    # Manual entry fields (Optional)
    brand: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    cost_price: Optional[float] = Field(None, gt=0, description="Cost Price must be > 0")
    average_rating: Optional[float] = Field(None, ge=0, le=5, description="Rating between 0 and 5")
    historical_sales: Optional[int] = Field(None, ge=0)
    product_lifecycle: Optional[str] = Field(None)
    season: Optional[str] = Field(None)

    # Market Conditions
    current_price: Optional[float] = Field(None, description="Current Selling Price")
    demand_index: float = Field(..., description="Calculated demand metric", ge=0)
    inventory_level: int = Field(..., description="Current stock level", ge=0)
    competitor_price: Optional[float] = Field(None, gt=0, description="Competitor Price must be > 0")
    promotion_type: str = Field(..., description="Promotion type (e.g., No Promotion, Percentage Discount)")

class ModelInfo(BaseModel):
    name: str
    version: str

class Factor(BaseModel):
    title: str
    label: str
    description: str
    impact_level: Optional[str] = Field(None, description="e.g. 'High Impact'")
    impact_stars: Optional[str] = Field(None, description="e.g. '★★★★★'")

class PricingFactor(BaseModel):
    """A single row in the comprehensive factor analysis table."""
    feature: str            # e.g. "Brand"
    value: str              # e.g. "Apple"
    effect: str             # "positive" | "negative" | "neutral" | "reference"
    effect_label: str       # e.g. "Positive (+)" shown in UI
    reason: str             # Business-friendly explanation

class PredictionResponse(BaseModel):
    is_new_product: bool = False
    product_name: str
    current_price: float
    optimal_price: float
    predicted_multiplier: float
    recommendation: str
    recommendation_reason: str
    overall_decision_summary: Optional[str] = Field(None, description="Synthesis of trade-offs")
    # Legacy factor lists (kept for backward compat)
    factors_increasing: List[Factor]
    factors_reducing: List[Factor]
    neutral_factors: List[Factor]
    # New comprehensive analysis
    pricing_factors: Optional[List[PricingFactor]] = Field(default=None, description="Full per-feature analysis table")
    current_revenue: float
    expected_revenue: float
    revenue_impact: float
    prediction_stability: float
    currency: str = "INR"
    model: ModelInfo
    prediction_time: str
