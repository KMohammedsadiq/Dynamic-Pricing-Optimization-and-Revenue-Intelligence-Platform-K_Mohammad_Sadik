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
