from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import prediction_service

from ml.demand_predictor import demand_predictor

router = APIRouter()


def _to_python(obj):
    """
    Recursively convert numpy scalar types to native Python types so that
    FastAPI's jsonable_encoder can serialize the response without errors.
    """
    import numpy as np
    if isinstance(obj, dict):
        return {k: _to_python(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_python(v) for v in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj

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

        # Fetch names from the database for all products
        db_products = db.query(Product.product_id, Product.product_name).all()

        # Build mapping: take the most descriptive name for each product_id
        id_to_name = {}
        for p in db_products:
            if p.product_name and p.product_id not in id_to_name:
                id_to_name[p.product_id] = p.product_name

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


# ─────────────────────────────────────────────────────────────────────────────
# SMART PRICE ADVISOR
# Combines XGBoost + Demand Forecast + Competitor Intelligence
# into a single unified Final Price with transparent breakdown.
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/smart-price/{product_id}")
def smart_price_advisor(product_id: str, db: Session = Depends(get_db)):
    """
    Runs all three pricing engines internally and returns one unified final price:
    1. XGBoost ML price prediction  -> base price (uses Product table which matches demand CSV)
    2. 30-day demand forecast       -> demand adjustment (+3% / 0% / -3%)
    3. Competitor price analysis    -> competitor adjustment (+2% / 0% / -3%)
    Final price = base x demand_factor x competitor_factor  (with cost floor guarantee)
    """
    import datetime

    try:
        from app.models.product import Product
        from app.models.product_catalog import ProductCatalog
        from app.models.competitor_price import CompetitorPriceHistory
        import ml.predictor as _predictor_module
        from ml.recommendation import RecommendationEngine

        # ── Step 1: Load product ──────────────────────────────────────────────
        # Primary source: Product table (same IDs as demand CSV, has all pricing fields)
        prod = (
            db.query(Product)
            .filter(Product.product_id == product_id, Product.is_deleted == False)
            .order_by(Product.id.desc())
            .first()
        )

        # Fallback: ProductCatalog table
        catalog_prod = None
        if not prod:
            catalog_prod = db.query(ProductCatalog).filter_by(product_id=product_id).first()
            if not catalog_prod:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product '{product_id}' not found. Make sure the Product ID is correct."
                )

        # ── Build unified product values ──────────────────────────────────────
        if prod:
            prod_name         = prod.product_name or product_id
            prod_brand        = getattr(prod, 'brand', None) or "Unknown"
            prod_category     = getattr(prod, 'category', None) or "General"
            current_price     = float(prod.base_price or prod.current_price or prod.unit_price or 100.0)
            cost_price_val    = float(prod.cost_price) if prod.cost_price else current_price * 0.8
            promotion_type    = getattr(prod, 'promotion_type', None) or "No Promotion"
            inventory_level   = int(prod.inventory_level) if prod.inventory_level else 100
            demand_index_val  = float(prod.demand_index) if prod.demand_index else 100.0
            launch_year       = getattr(prod, 'launch_year', None) or 2023
            days_since_launch = getattr(prod, 'days_since_launch', None) or 365
            lifecycle         = getattr(prod, 'product_lifecycle', None) or "Maturity"
            competitor_price  = float(prod.competitor_price) if prod.competitor_price else current_price
            avg_rating        = float(prod.average_rating) if prod.average_rating else 4.0
            review_count      = int(prod.review_count) if prod.review_count else 100
            hist_sales        = int(prod.historical_sales) if prod.historical_sales else 1000
            profit_margin     = float(prod.profit_margin) if prod.profit_margin else 20.0
            supplier_name     = getattr(prod, 'supplier_name', None) or "Unknown"
        else:
            p = catalog_prod
            prod_name         = p.product_name or product_id
            prod_brand        = getattr(p, 'brand', None) or "Unknown"
            prod_category     = getattr(p, 'category', None) or "General"
            current_price     = float(p.base_price) if p.base_price else 100.0
            cost_price_val    = float(p.cost_price) if p.cost_price else current_price * 0.8
            promotion_type    = "No Promotion"
            inventory_level   = int(p.initial_inventory) if p.initial_inventory else 100
            demand_index_val  = 100.0
            launch_year       = getattr(p, 'launch_year', None) or 2023
            days_since_launch = getattr(p, 'days_since_launch', None) or 365
            lifecycle         = getattr(p, 'product_lifecycle', None) or "Maturity"
            competitor_price  = float(p.competitor_price) if p.competitor_price else current_price
            avg_rating        = float(p.average_rating) if p.average_rating else 4.0
            review_count      = int(p.review_count) if p.review_count else 100
            hist_sales        = int(p.historical_sales) if p.historical_sales else 1000
            profit_margin     = float(p.profit_margin) if p.profit_margin else 20.0
            supplier_name     = getattr(p, 'supplier_name', None) or "Unknown"

        # ── Step 2: XGBoost prediction ────────────────────────────────────────
        month = datetime.datetime.now().month
        season = (
            "Winter" if month in [12, 1, 2] else
            "Spring" if month in [3, 4, 5] else
            "Summer" if month in [6, 7, 8] else
            "Autumn"
        )

        feature_dict = {
            "category":          prod_category,
            "brand":             prod_brand,
            "season":            season,
            "base_price":        current_price,
            "promotion_type":    promotion_type,
            "inventory_level":   inventory_level,
            "demand_index":      demand_index_val,
            "launch_year":       launch_year,
            "days_since_launch": days_since_launch,
            "product_lifecycle": lifecycle,
            "cost_price":        cost_price_val,
            "competitor_price":  competitor_price,
            "average_rating":    avg_rating,
            "review_count":      review_count,
            "historical_sales":  hist_sales,
            "profit_margin":     profit_margin,
            "supplier_name":     supplier_name,
            "current_price":     current_price,
        }

        xgb_result    = _predictor_module.predictor.predict(feature_dict)
        xgb_price     = xgb_result["predicted_price"]
        xgb_stability = xgb_result["prediction_stability"]

        # ── Step 3: 30-day demand forecast ───────────────────────────────────
        demand_trend = "Stable"
        demand_units = None
        demand_conf  = None
        demand_err   = None
        try:
            dr           = demand_predictor.predict(product_id, 30)
            demand_trend = dr.get("demand_trend", "Stable")
            demand_units = dr.get("predicted_demand")
            demand_conf  = dr.get("confidence_score")
        except Exception as ex:
            demand_err = str(ex)

        # ── Step 4: Competitor prices from DB ────────────────────────────────
        comps       = db.query(CompetitorPriceHistory).filter_by(product_id=product_id).all()
        comp_prices = [float(c.price) for c in comps if c.price and float(c.price) > 0]
        market_avg  = round(sum(comp_prices) / len(comp_prices), 2) if comp_prices else None
        market_low  = round(min(comp_prices), 2) if comp_prices else None
        amazon_p    = next((float(c.price) for c in comps if c.competitor_name == "Amazon"), None)
        flipkart_p  = next((float(c.price) for c in comps if c.competitor_name == "Flipkart"), None)

        # ── Step 5: Demand adjustment ─────────────────────────────────────────
        demand_adj = {"Increasing": +0.03, "Stable": 0.00, "Decreasing": -0.03}.get(demand_trend, 0.0)

        # ── Step 6: Competitor adjustment ────────────────────────────────────
        comp_adj    = 0.0
        comp_signal = "No competitor data synced — no adjustment applied"
        if market_avg and market_avg > 0:
            gap = (xgb_price - market_avg) / market_avg
            if gap > 0.10:
                comp_adj    = -0.03
                comp_signal = f"Price is {gap*100:.1f}% above market average — adjusted down 3%"
            elif gap < -0.10:
                comp_adj    = +0.02
                comp_signal = f"Price is {abs(gap)*100:.1f}% below market average — adjusted up 2%"
            else:
                comp_signal = f"Price is within 10% of market average ({gap*100:+.1f}%) — no adjustment"

        # ── Step 7: Compute final price ───────────────────────────────────────
        final         = round(xgb_price * (1 + demand_adj) * (1 + comp_adj), 2)
        cost_floor    = cost_price_val * 1.10
        floor_applied = final < cost_floor
        if floor_applied:
            final = round(cost_floor, 2)

        # ── Step 8: Recommendation engine on final price ──────────────────────
        rec = RecommendationEngine().generate_recommendation(current_price, final, feature_dict)

        # ── Step 9: Return full breakdown (convert numpy types for JSON serialization) ──
        response = {
            "product": {
                "id":            product_id,
                "name":          prod_name,
                "brand":         prod_brand,
                "category":      prod_category,
                "current_price": float(current_price),
                "cost_price":    float(cost_price_val),
            },
            "engines": {
                "xgboost": {
                    "price":     float(round(xgb_price, 2)),
                    "stability": float(xgb_stability) if xgb_stability is not None else None,
                    "label":     "XGBoost ML Base Price",
                },
                "demand": {
                    "trend":            demand_trend,
                    "adjustment_pct":   float(round(demand_adj * 100, 1)),
                    "adjustment_label": f"{demand_trend} demand -> {'+' if demand_adj >= 0 else ''}{demand_adj*100:.1f}%",
                    "predicted_units":  float(demand_units) if demand_units is not None else None,
                    "confidence":       float(demand_conf) if demand_conf is not None else None,
                    "error":            demand_err,
                },
                "competitor": {
                    "market_average":   float(market_avg) if market_avg is not None else None,
                    "market_lowest":    float(market_low) if market_low is not None else None,
                    "amazon_price":     float(amazon_p) if amazon_p is not None else None,
                    "flipkart_price":   float(flipkart_p) if flipkart_p is not None else None,
                    "adjustment_pct":   float(round(comp_adj * 100, 1)),
                    "adjustment_label": comp_signal,
                },
            },
            "final_price": {
                "value":                   float(final),
                "cost_floor":              float(round(cost_floor, 2)),
                "floor_applied":           bool(floor_applied),
                "change_from_current_pct": float(round((final - current_price) / current_price * 100, 1)) if current_price else 0.0,
                "recommendation":          rec.get("recommendation"),
                "summary":                 rec.get("recommendation_reason"),
            },
            "factors": {
                "increasing": rec.get("factors_increasing", []),
                "reducing":   rec.get("factors_reducing", []),
                "neutral":    rec.get("neutral_factors", []),
            },
            "revenue": {
                "current":   rec.get("current_revenue"),
                "projected": rec.get("expected_revenue"),
                "impact":    rec.get("revenue_impact"),
            },
            "generated_at": datetime.datetime.now().isoformat(),
        }
        return _to_python(response)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
