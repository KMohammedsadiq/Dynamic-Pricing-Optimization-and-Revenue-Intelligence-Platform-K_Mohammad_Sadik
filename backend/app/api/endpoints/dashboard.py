from fastapi import APIRouter, Depends
from typing import Annotated
from app.api.deps import require_admin, require_pricing_manager, require_business_analyst, get_current_user_token

router = APIRouter()

# ---------------------------------------------------------
# ANY AUTHENTICATED USER
# ---------------------------------------------------------
@router.get("/profile")
def get_user_profile(token_payload: Annotated[dict, Depends(get_current_user_token)]):
    """
    Accessible by anyone who is logged in.
    """
    return {"message": "Welcome to your profile", "user": token_payload}

# ---------------------------------------------------------
# ADMIN ENDPOINTS
# ---------------------------------------------------------
@router.get("/admin/users")
def get_all_users(token_payload: Annotated[dict, Depends(require_admin)]):
    """
    User Management - Only accessible by Admins
    """
    return {"message": "Admin Access Granted: Returning all users"}

@router.post("/admin/models/train")
def train_ai_model(token_payload: Annotated[dict, Depends(require_admin)]):
    """
    AI Model Training - Only accessible by Admins
    """
    return {"message": "Admin Access Granted: AI Model Training Started"}

# ---------------------------------------------------------
# PRICING MANAGER ENDPOINTS
# ---------------------------------------------------------
@router.post("/pricing/predict")
def predict_prices(token_payload: Annotated[dict, Depends(require_pricing_manager)]):
    """
    Price Prediction - Only accessible by Pricing Managers (and Admins)
    """
    return {"message": "Pricing Manager Access Granted: Running Price Prediction Algorithm"}

@router.get("/pricing/competitors")
def get_competitor_analysis(token_payload: Annotated[dict, Depends(require_pricing_manager)]):
    """
    Competitor Analysis - Only accessible by Pricing Managers (and Admins)
    """
    return {"message": "Pricing Manager Access Granted: Returning Competitor Data"}

# ---------------------------------------------------------
# BUSINESS ANALYST ENDPOINTS
# ---------------------------------------------------------
@router.get("/analytics/forecasts")
def get_revenue_forecasts(token_payload: Annotated[dict, Depends(require_business_analyst)]):
    """
    Forecasts - Only accessible by Business Analysts (and Admins)
    """
    return {"message": "Business Analyst Access Granted: Returning Revenue Forecasts"}

@router.get("/analytics/revenue")
def get_revenue_reports(token_payload: Annotated[dict, Depends(require_business_analyst)]):
    """
    Revenue - Only accessible by Business Analysts (and Admins)
    """
    return {"message": "Business Analyst Access Granted: Returning Revenue Reports"}
