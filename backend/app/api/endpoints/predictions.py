from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service

from ml.demand_predictor import demand_predictor

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
def predict_price_endpoint(request_data: PredictionRequest, db: Session = Depends(get_db)):
    """
    Predict optimal product price using the trained XGBoost pipeline.
    Combines static DB product attributes with dynamic user input.
    """
    input_dict = request_data.model_dump()
    result = prediction_service.predict(db, input_dict)
    return result

@router.post("/business-recommendation", response_model=PredictionResponse)
def business_recommendation_endpoint(request_data: PredictionRequest, db: Session = Depends(get_db)):
    """
    Alias for /predict-price. Only one underlying ML flow is executed.
    """
    input_dict = request_data.model_dump()
    result = prediction_service.predict(db, input_dict)
    return result



@router.get("/forecast")
def demand_forecast_endpoint(
    product_id: str = Query(..., description="Product ID to forecast"),
    horizon: int = Query(..., description="Forecast horizon in days (7, 14, 30, 90, 180, 365)")
):
    """
    Predict future demand using the XGBoost Demand Forecasting models.
    """
    try:
        result = demand_predictor.predict(product_id, horizon)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
def available_products_endpoint(db: Session = Depends(get_db)):
    """
    Get a list of all product IDs available for Demand Forecasting.
    """
    try:
        product_ids = demand_predictor.get_available_products()
        from app.models.product import Product
        
        # Fetch names from the database for all products to avoid SQLite "too many variables" limit
        # in the IN clause, then filter in memory.
        db_products = db.query(Product.product_id, Product.product_name).all()
        
        # Build mapping for unique products
        id_to_name = {p.product_id: p.product_name for p in db_products if p.product_name}
        
        result = [
            {"id": pid, "name": id_to_name.get(pid, pid)}
            for pid in product_ids
        ]
        
        return {"products": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue-optimization/{product_id}")
def get_revenue_optimization_recommendation(product_id: str, db: Session = Depends(get_db)):
    """
    Returns a unified PricePilot recommendation gathering data from:
    - Product DB
    - Demand Forecast
    - Competitor Sync
    - ML Price Predictor
    - Recommendation Engine
    """
    try:
        from app.models.product_catalog import ProductCatalog
        from app.models.competitor_price import CompetitorPriceHistory
        from ml.predictor import Predictor
        from ml.recommendation import RecommendationEngine
        
        # 1. Product Info
        prod = db.query(ProductCatalog).filter_by(product_id=product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found in ML catalog.")
            
        # 2. Demand Forecast
        try:
            forecast_data = demand_predictor.predict(product_id, 30)
            forecast = forecast_data.get("forecast", [])
            history = forecast_data.get("historical_data", [])
        except Exception:
            forecast = []
            history = []
            
        # 3. Competitor Prices
        comps = db.query(CompetitorPriceHistory).filter_by(product_id=product_id).all()
        amazon = next((c for c in comps if c.competitor_name == "Amazon"), None)
        flipkart = next((c for c in comps if c.competitor_name == "Flipkart"), None)
        
        comp_prices = [float(c.price) for c in comps if c.price > 0]
        market_lowest = min(comp_prices) if comp_prices else None
        market_average = sum(comp_prices)/len(comp_prices) if comp_prices else None
        
        # 4. ML Optimal Price
        base_price = float(prod.base_price) if prod.base_price else 0.0
        cost_price = base_price * 0.8
        
        input_data = {
            'product_name': prod.product_name,
            'brand': prod.brand,
            'category': prod.category,
            'cost_price': cost_price,
            'average_rating': 4.5,
            'historical_sales': 1500,
            'product_lifecycle': 'Mature',
            'season': 'Winter',
            'current_price': base_price,
            'demand_index': 1.0,
            'inventory_level': 50,
            'competitor_price': market_average if market_average else base_price,
            'promotion_type': 'No Promotion'
        }
        
        p = Predictor()
        pred_result = p.predict(input_data)
        optimal_price = pred_result.get("predicted_price")
        
        # 5. Recommendation Engine
        rec_engine = RecommendationEngine()
        rec_data = rec_engine.generate_recommendation(
            current_price=base_price,
            predicted_price=optimal_price,
            feature_dict=input_data
        )
        
        # 6. Price Gap
        price_gap_pct = ((optimal_price - market_average) / market_average * 100) if market_average else 0
        
        return {
            "product": {
                "id": prod.product_id,
                "name": prod.product_name,
                "brand": prod.brand,
                "category": prod.category,
                "current_price": base_price,
                "cost_price": cost_price
            },
            "demand": {
                "history": history[-30:] if history else [],
                "forecast": forecast
            },
            "competitors": {
                "amazon": {
                    "price": amazon.price if amazon else None,
                    "confidence": amazon.match_confidence if amazon else None
                },
                "flipkart": {
                    "price": flipkart.price if flipkart else None,
                    "confidence": flipkart.match_confidence if flipkart else None
                },
                "market_lowest": market_lowest,
                "market_average": market_average,
                "price_gap_pct": price_gap_pct
            },
            "ml": {
                "optimal_price": optimal_price,
                "multiplier": pred_result.get("predicted_multiplier"),
                "stability": pred_result.get("prediction_stability")
            },
            "recommendation": {
                "action": rec_data.get("recommendation"),
                "reason": rec_data.get("recommendation_reason"),
                "factors": rec_data.get("pricing_factors")
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
