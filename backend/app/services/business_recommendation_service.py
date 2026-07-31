from app.services.prediction_service import prediction_service
from app.services.historical_price_service import historical_price_service
import logging

logger = logging.getLogger("BusinessRecommendationService")

class BusinessRecommendationService:
    def get_recommendation(self, input_data: dict) -> dict:
        # 1. Call Prediction Service
        prediction_result = prediction_service.predict(input_data)
        predicted_price = prediction_result["predicted_price"]

        # 2. Call Historical Service
        historical_result = historical_price_service.analyze(
            category=input_data.get("category"),
            brand=input_data.get("brand"),
            region=input_data.get("region"),
            season=input_data.get("season"),
            base_price=input_data.get("base_price", 0)
        )

        reasons = []
        recommendation = ""
        
        # Base case: No historical data
        if historical_result["matching_records"] == 0:
            return {
                "predicted_price": predicted_price,
                "historical_average_price": None,
                "price_difference": None,
                "difference_percentage": None,
                "recommendation": "Trust ML Prediction",
                "reasons": ["No historical comparison available. Returning raw ML prediction."],
                "historical_summary": None
            }

        hist_avg = historical_result["average_price"]
        price_diff = round(predicted_price - hist_avg, 2)
        diff_pct = round((price_diff / hist_avg) * 100, 2)

        # 4. Apply Business Rules
        if diff_pct > 5.0:
            recommendation = "Increase Price"
            reasons.append("Predicted demand supports higher pricing than historical average.")
        elif diff_pct < -5.0:
            recommendation = "Reduce Price"
            reasons.append("Historical market suggests the product is overpriced.")
        else:
            recommendation = "Maintain Current Pricing"
            reasons.append("Current pricing aligns with historical trends.")

        # Additional rules based on demand, inventory, and promotions
        if input_data.get("demand_index", 0) > historical_result.get("average_demand_index", 0):
            reasons.append("Current demand is stronger than historical average.")
            
        if input_data.get("inventory_level", 0) < historical_result.get("average_inventory", 0):
            reasons.append("Inventory is lower than historical average.")
            
        if historical_result.get("most_common_promotion") == "No Promotion":
            reasons.append("Similar products historically performed well without promotions.")

        return {
            "predicted_price": predicted_price,
            "historical_average_price": hist_avg,
            "price_difference": price_diff,
            "difference_percentage": diff_pct,
            "recommendation": recommendation,
            "reasons": reasons,
            "historical_summary": {
                "matching_records": historical_result["matching_records"],
                "average_price": hist_avg,
                "highest_price": historical_result["highest_price"],
                "lowest_price": historical_result["lowest_price"]
            }
        }

business_recommendation_service = BusinessRecommendationService()
