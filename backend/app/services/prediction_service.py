# PredictionService v2.2 - with future price projection
import logging
import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.product_catalog import ProductCatalog
import ml.predictor as _predictor_module
from ml.recommendation import recommendation_engine
from ml.config import DEFAULT_VALUES

logger = logging.getLogger("PredictionService")

class PredictionService:
    def _build_feature_dict(self, db: Session, input_data: dict) -> dict:
        is_new_product = input_data.get("is_new_product", False)
        product_name = input_data.get("product_name")
        if not product_name:
            raise HTTPException(status_code=400, detail="product_name is required")

        feature_dict = DEFAULT_VALUES.copy()
        
        current_month = datetime.datetime.now().month
        if current_month in [12, 1, 2]:
            current_season = "Winter"
        elif current_month in [3, 4, 5]:
            current_season = "Spring"
        elif current_month in [6, 7, 8]:
            current_season = "Summer"
        else:
            current_season = "Autumn"
            
        feature_dict["season"] = current_season

        if is_new_product:
            cost_price = input_data.get("cost_price")
            if not cost_price:
                raise HTTPException(status_code=400, detail="cost_price is required for new products")
                
            current_price = input_data.get("current_price")
            if not current_price:
                current_price = float(cost_price) * 1.20
                
            if current_price < cost_price:
                raise HTTPException(status_code=400, detail="Current Selling Price must be >= Cost Price")

            feature_dict.update({
                "category": input_data.get("category") or DEFAULT_VALUES["category"],
                "brand": input_data.get("brand") or DEFAULT_VALUES["brand"],
                "base_price": float(cost_price),
                "cost_price": float(cost_price),
                "current_price": float(current_price),
                "launch_year": datetime.datetime.now().year,
                "days_since_launch": 0,
                "product_lifecycle": input_data.get("product_lifecycle") or "New Launch",
                "competitor_price": float(input_data.get("competitor_price", 0)) if input_data.get("competitor_price") else float(current_price),
                "average_rating": float(input_data.get("average_rating", 0)) if input_data.get("average_rating") is not None else 0.0,
                "review_count": 0,
                "historical_sales": int(input_data.get("historical_sales", 0)) if input_data.get("historical_sales") is not None else 0,
                "profit_margin": float((current_price - float(cost_price)) / current_price * 100) if current_price > 0 else 0,
                "season": input_data.get("season") or current_season,
            })
        else:
            product_record = db.query(ProductCatalog).filter(ProductCatalog.product_name == product_name).first()
            if product_record:
                feature_dict.update({
                    "category": product_record.category or DEFAULT_VALUES["category"],
                    "brand": product_record.brand or DEFAULT_VALUES["brand"],
                    "base_price": float(product_record.base_price) if product_record.base_price else DEFAULT_VALUES["base_price"],
                    "cost_price": float(product_record.cost_price) if product_record.cost_price else float(product_record.base_price) * 0.8 if product_record.base_price else DEFAULT_VALUES["cost_price"],
                    "current_price": float(product_record.current_price) if getattr(product_record, 'current_price', None) else None,
                    "launch_year": product_record.launch_year or DEFAULT_VALUES["launch_year"],
                    "days_since_launch": product_record.days_since_launch or DEFAULT_VALUES["days_since_launch"],
                    "product_lifecycle": product_record.product_lifecycle or DEFAULT_VALUES["product_lifecycle"],
                    "competitor_price": float(product_record.competitor_price) if product_record.competitor_price else float(product_record.base_price) * 0.95 if product_record.base_price else DEFAULT_VALUES["competitor_price"],
                    "average_rating": float(product_record.average_rating) if product_record.average_rating else DEFAULT_VALUES["average_rating"],
                    "review_count": product_record.review_count or DEFAULT_VALUES["review_count"],
                    "historical_sales": product_record.historical_sales or DEFAULT_VALUES["historical_sales"],
                    "profit_margin": float(product_record.profit_margin) if product_record.profit_margin else DEFAULT_VALUES["profit_margin"],
                    "supplier_name": product_record.supplier_name or DEFAULT_VALUES["supplier_name"],
                })
            else:
                logger.warning(f"Product '{product_name}' not found in database. Relying on default static attributes.")

            if input_data.get("current_price") is not None:
                feature_dict["current_price"] = input_data["current_price"]
            else:
                feature_dict["current_price"] = feature_dict.get("current_price") or feature_dict.get("base_price", 100)
                
            if feature_dict.get("current_price") is None:
                raise HTTPException(status_code=400, detail="current_price could not be determined")
                
            if input_data.get("competitor_price") is not None:
                feature_dict["competitor_price"] = input_data["competitor_price"]

        feature_dict["demand_index"] = input_data.get("demand_index", feature_dict.get("demand_index"))
        feature_dict["inventory_level"] = input_data.get("inventory_level", feature_dict.get("inventory_level"))
        feature_dict["promotion_type"] = input_data.get("promotion_type", feature_dict.get("promotion_type"))

        return feature_dict, is_new_product, product_name

    def predict(self, db: Session, input_data: dict) -> dict:
        feature_dict, is_new_product, product_name = self._build_feature_dict(db, input_data)

        try:
            prediction_result = _predictor_module.predictor.predict(feature_dict)
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

        rec_result = recommendation_engine.generate_recommendation(
            current_price=prediction_result["current_price"],
            predicted_price=prediction_result["predicted_price"],
            feature_dict=feature_dict
        )

        return {
            "is_new_product": is_new_product,
            "product_name": product_name,
            "current_price": prediction_result["current_price"],
            "optimal_price": prediction_result["predicted_price"],
            "predicted_multiplier": prediction_result["predicted_multiplier"],
            "recommendation": rec_result["recommendation"],
            "recommendation_reason": rec_result["recommendation_reason"],
            "overall_decision_summary": rec_result.get("overall_decision_summary"),
            "factors_increasing": rec_result["factors_increasing"],
            "factors_reducing": rec_result["factors_reducing"],
            "neutral_factors": rec_result["neutral_factors"],
            "pricing_factors": rec_result.get("pricing_factors", []),
            "current_revenue": rec_result["current_revenue"],
            "expected_revenue": rec_result["expected_revenue"],
            "revenue_impact": rec_result["revenue_impact"],
            "total_inventory_cost": rec_result.get("total_inventory_cost"),
            "prediction_stability": prediction_result["prediction_stability"],
            "currency": "INR",
            "model": prediction_result["model"],
            "prediction_time": datetime.datetime.now().isoformat()
        }

prediction_service = PredictionService()
