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
            product_name=input_data.get("product_name"),
            product_model=input_data.get("product_model"),
            category=input_data.get("category"),
            brand=input_data.get("brand"),
            region=input_data.get("region"),
            season=input_data.get("season"),
            base_price=input_data.get("base_price", 0)
        )

        reasons = []
        recommendation = "Maintain Current Pricing"
        
        # Extract inputs for rules
        competitor_price = input_data.get("competitor_price", 0)
        demand_index = input_data.get("demand_index", 0)
        inventory_level = input_data.get("inventory_level", 0)
        product_lifecycle = input_data.get("product_lifecycle", "")
        average_rating = input_data.get("average_rating", 0)
        profit_margin = input_data.get("profit_margin", 0)
        
        hist_avg = historical_result.get("average_price")
        
        # Determine High/Low bounds (can be tuned or relative to historical)
        demand_high = demand_index > 110
        demand_low = demand_index < 90
        inventory_high = inventory_level > 500
        is_new_product = product_lifecycle == "Introduction" or input_data.get("days_since_launch", 999) < 90
        is_mature_product = product_lifecycle == "Maturity" or product_lifecycle == "Decline"
        target_margin = 15.0 # Example target

        # 3. Apply Robust Business Rules
        
        # Rule 5: Profit Margin < Target -> Do not reduce price (Highest precedence guardrail)
        if profit_margin < target_margin and predicted_price < input_data.get("base_price", 0):
            recommendation = "Maintain Pricing"
            reasons.append("Profit Margin is below target. Do not reduce price further to protect profitability.")
            
        # Rule 1: Competitor Price > Predicted Price AND Demand High -> Increase Price
        elif competitor_price > predicted_price and demand_high:
            recommendation = "Increase Price"
            reasons.append("Competitor is pricing higher and demand is strong. We can increase margins.")
            
        # Rule 2: Inventory High AND Demand Low -> Reduce Price
        elif inventory_high and demand_low:
            recommendation = "Reduce Price"
            reasons.append("High inventory with low demand detected. Price reduction recommended to clear stock.")
            
        # Rule 3: New Product AND High Rating -> Maintain Premium Pricing
        elif is_new_product and average_rating >= 4.5:
            recommendation = "Maintain Premium Pricing"
            reasons.append("Product is new and highly rated. Maintain premium positioning.")
            
        # Rule 4: Mature Product AND Historical Sales Falling (or generally mature) -> Consider Promotion
        elif is_mature_product:
            recommendation = "Consider Promotion"
            reasons.append("Product is mature. Promotional pricing may help reinvigorate sales volume.")
        else:
            reasons.append("Current pricing strategy is optimal for market conditions.")

        # Formatting historical summary safely
        historical_summary = None
        if historical_result["matching_records"] > 0:
            historical_summary = {
                "matching_records": historical_result["matching_records"],
                "average_price": historical_result.get("average_price"),
                "highest_price": historical_result.get("highest_price"),
                "lowest_price": historical_result.get("lowest_price")
            }
            
        # Generate dynamic business summary checklist
        business_summary_checklist = []
        if demand_high:
            business_summary_checklist.append("Demand is High")
        elif demand_low:
            business_summary_checklist.append("Demand is Low")
        else:
            business_summary_checklist.append("Demand is Normal")
            
        if inventory_high:
            business_summary_checklist.append("Inventory is High")
        else:
            business_summary_checklist.append("Inventory is Low")
            
        if input_data.get("promotion_type", "No Promotion") != "No Promotion":
            business_summary_checklist.append("Promotion is active")
        else:
            business_summary_checklist.append("No promotion active")
            
        if hist_avg and predicted_price < hist_avg:
            business_summary_checklist.append("Predicted price is below historical average")
        elif hist_avg and predicted_price > hist_avg:
            business_summary_checklist.append("Predicted price is above historical average")
            
        if input_data.get("season", "") == "Winter":
            business_summary_checklist.append("Winter season effect")
            
        explanation = prediction_result.get("explanation")
        if explanation:
            explanation["business_summary_checklist"] = business_summary_checklist
            explanation["final_recommendation"] = recommendation

        return {
            "predicted_price": predicted_price,
            "historical_average_price": hist_avg,
            "recommendation": recommendation,
            "reasons": reasons,
            "historical_summary": historical_summary,
            "explanation": explanation
        }

business_recommendation_service = BusinessRecommendationService()
