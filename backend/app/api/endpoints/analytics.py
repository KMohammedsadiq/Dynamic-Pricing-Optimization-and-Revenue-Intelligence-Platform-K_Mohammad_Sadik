from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.session import get_db
from app.api.deps import get_current_user_token
from app.services import analytics_service
from app.services.strategy_service import PricingStrategyEngine
from ml.demand_predictor import demand_predictor
from ml.predictor import Predictor

router = APIRouter()

@router.get("/executive-summary")
def get_executive_summary(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    try:
        return analytics_service.get_executive_summary(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pricing-strategy/{product_id}")
def get_pricing_strategy(
    product_id: str,
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    try:
        # Get Demand Forecast
        try:
            forecast_data = demand_predictor.predict(product_id, 30)
            demand_trend = forecast_data.get("demand_trend", "Stable")
        except Exception:
            demand_trend = "Stable"
            
        # Get ML Optimal Price
        # We simulate the input data format used by the Predictor
        try:
            p = Predictor()
            from app.models.product_catalog import ProductCatalog
            prod = db.query(ProductCatalog).filter_by(product_id=product_id).first()
            if prod:
                input_data = {
                    'product_name': prod.product_name,
                    'brand': prod.brand,
                    'category': prod.category,
                    'cost_price': float(prod.cost_price or 0),
                    'average_rating': 4.5,
                    'historical_sales': 1500,
                    'product_lifecycle': 'Mature',
                    'season': 'Winter',
                    'current_price': float(prod.base_price or 0),
                    'demand_index': 100,
                    'inventory_level': 50,
                    'competitor_price': float(prod.base_price or 0),
                    'promotion_type': 'No Promotion'
                }
                pred_result = p.predict(input_data)
                optimal_price = pred_result.get("predicted_price")
            else:
                optimal_price = None
        except Exception:
            optimal_price = None

        engine = PricingStrategyEngine(db)
        strategy = engine.generate_strategy_for_product(
            product_id=product_id,
            ml_optimal_price=optimal_price,
            demand_trend=demand_trend
        )
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pricing-strategies")
def get_pricing_strategies_bulk(
    token_payload: Annotated[dict, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    try:
        from app.services.analytics_service import get_strategy_distribution_all_products
        strategies = get_strategy_distribution_all_products(db, return_raw=True)
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
