from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.session import get_db
from app.api.deps import get_current_user_token
from app.services import analytics_service

router = APIRouter()

@router.get("/alerts")
def get_business_alerts(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.generate_business_alerts(db)

@router.get("/product-performance")
def get_product_performance(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_product_performance(db)

@router.get("/profitability")
def get_profitability_analysis(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_profitability_analysis(db)

@router.get("/promotions")
def get_promotion_analysis(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_promotion_analysis(db)

@router.get("/regional")
def get_regional_performance(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_regional_performance(db)

@router.get("/inventory")
def get_inventory_analysis(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_inventory_analysis(db)

@router.get("/revenue")
def get_revenue_analysis(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    return analytics_service.get_revenue_analysis(db)
