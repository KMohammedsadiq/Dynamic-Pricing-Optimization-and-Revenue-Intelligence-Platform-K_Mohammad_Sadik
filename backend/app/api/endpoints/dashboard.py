from fastapi import APIRouter, Depends
from typing import Annotated
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from app.api.deps import require_admin, require_pricing_manager, require_business_analyst, get_current_user_token
from app.db.session import get_db
from app.models.product import Product

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

@router.get("/summary")
def get_dashboard_summary(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    """
    Returns aggregated KPIs for the executive dashboard.
    Accessible by any logged-in user.
    """
    result = db.query(
        func.count(Product.id).label("total_products"),
        func.sum(Product.revenue).label("total_revenue"),
        func.avg(Product.current_price).label("average_price"),
        func.avg(Product.discount_pct).label("average_discount"),
        func.avg(Product.demand_index).label("average_demand"),
        func.count(distinct(Product.brand)).label("total_brands"),
        func.count(distinct(Product.category)).label("total_categories"),
        func.sum(Product.inventory_level).label("total_inventory"),
    ).first()

    return {
        "total_products": result.total_products or 0,
        "total_revenue": result.total_revenue or 0,
        "average_price": result.average_price or 0,
        "average_discount": result.average_discount or 0,
        "average_demand": result.average_demand or 0,
        "total_brands": result.total_brands or 0,
        "total_categories": result.total_categories or 0,
        "total_inventory": result.total_inventory or 0,
    }

# ---------------------------------------------------------
# BUSINESS INTELLIGENCE ENDPOINTS (Phase 2, 3, 4)
# ---------------------------------------------------------

from sqlalchemy import desc, case, and_

@router.get("/revenue-by-category")
def get_revenue_by_category(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    results = db.query(
        Product.category,
        func.sum(Product.revenue).label("total_revenue")
    ).filter(Product.category.isnot(None))\
     .group_by(Product.category)\
     .order_by(desc("total_revenue"))\
     .all()
    
    return [{"category": r.category, "total_revenue": float(r.total_revenue or 0)} for r in results]

@router.get("/revenue-by-brand")
def get_revenue_by_brand(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    results = db.query(
        Product.brand,
        func.sum(Product.revenue).label("total_revenue")
    ).filter(Product.brand.isnot(None))\
     .group_by(Product.brand)\
     .order_by(desc("total_revenue"))\
     .limit(10)\
     .all()
    
    return [{"brand": r.brand, "total_revenue": float(r.total_revenue or 0)} for r in results]

@router.get("/inventory-overview")
def get_inventory_overview(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    result = db.query(
        func.sum(Product.inventory_level).label("total_inventory"),
        func.sum(case((Product.inventory_level == 0, 1), else_=0)).label("stockout"),
        func.sum(case((and_(Product.inventory_level > 0, Product.inventory_level <= 50), 1), else_=0)).label("low"),
        func.sum(case((and_(Product.inventory_level > 50, Product.inventory_level <= 150), 1), else_=0)).label("medium"),
        func.sum(case((Product.inventory_level > 150, 1), else_=0)).label("high")
    ).first()
    
    return {
        "total_inventory": int(result.total_inventory or 0),
        "breakdown": [
            {"name": "Stockout (0)", "value": int(result.stockout or 0)},
            {"name": "Low (1-50)", "value": int(result.low or 0)},
            {"name": "Medium (51-150)", "value": int(result.medium or 0)},
            {"name": "High (>150)", "value": int(result.high or 0)}
        ]
    }

@router.get("/product-analytics/{sku}")
def get_product_analytics(
    sku: str,
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    """
    Returns aggregated historical analytics for a specific SKU.
    """
    result = db.query(
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_current_price"),
        func.avg(Product.discount_pct).label("avg_discount"),
        func.avg(Product.demand_index).label("avg_demand"),
        func.avg(Product.price_change_pct).label("avg_price_change"),
        func.sum(Product.inventory_level).label("total_inventory"),
    ).filter(Product.product_id == sku).first()

    # Get the latest snapshot for categorical data (region, channel, season, promotion)
    latest = db.query(Product).filter(Product.product_id == sku).order_by(desc(Product.date)).first()

    if not result or not result.total_revenue:
        return {
            "revenue": 0,
            "units_sold": 0,
            "current_price": 0,
            "discount_pct": 0,
            "demand_index": 0,
            "price_change_pct": 0,
            "inventory_level": 0,
            "stockout_flag": False,
            "promotion_type": "None",
            "region": "N/A",
            "channel": "N/A",
            "season": "N/A"
        }

    return {
        "revenue": float(result.total_revenue or 0),
        "units_sold": int(result.total_units or 0),
        "current_price": float(result.avg_current_price or 0),
        "discount_pct": float(result.avg_discount or 0),
        "demand_index": float(result.avg_demand or 0),
        "price_change_pct": float(result.avg_price_change or 0),
        "inventory_level": int(result.total_inventory or 0),
        "stockout_flag": bool(result.total_inventory == 0),
        "promotion_type": latest.promotion_type if latest else "None",
        "region": latest.region if latest else "N/A",
        "channel": latest.channel if latest else "N/A",
        "season": latest.season if latest else "N/A",
        "date": latest.date.isoformat() if latest and latest.date else None
    }

@router.get("/promotion-analysis")
def get_promotion_analysis(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    results = db.query(
        Product.promotion_type,
        func.sum(Product.revenue).label("total_revenue"),
        func.avg(Product.discount_pct).label("average_discount"),
        func.count(Product.id).label("products_count")
    ).filter(Product.promotion_type.isnot(None))\
     .group_by(Product.promotion_type)\
     .order_by(desc("total_revenue"))\
     .all()
    
    return [
        {
            "promotion_type": r.promotion_type,
            "total_revenue": float(r.total_revenue or 0),
            "average_discount": float(r.average_discount or 0),
            "products_count": int(r.products_count or 0)
        } for r in results
    ]

@router.get("/regional-sales")
def get_regional_sales(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    results = db.query(
        Product.region,
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units")
    ).filter(Product.region.isnot(None))\
     .group_by(Product.region)\
     .order_by(desc("total_revenue"))\
     .all()
    
    return [
        {
            "region": r.region,
            "total_revenue": float(r.total_revenue or 0),
            "units_sold": int(r.total_units or 0)
        } for r in results
    ]

@router.get("/seasonal-performance")
def get_seasonal_performance(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    results = db.query(
        Product.season,
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.demand_index).label("average_demand")
    ).filter(Product.season.isnot(None))\
     .group_by(Product.season)\
     .order_by(desc("total_revenue"))\
     .all()
    
    return [
        {
            "season": r.season,
            "total_revenue": float(r.total_revenue or 0),
            "units_sold": int(r.total_units or 0),
            "average_demand": float(r.average_demand or 0)
        } for r in results
    ]

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
