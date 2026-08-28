from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models.product import Product
from app.models.product_catalog import ProductCatalog
from app.models.competitor_price import CompetitorPriceHistory
from app.utils.financials import calculate_financials

class PricingStrategyEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_strategy_for_product(self, product_id: str, ml_optimal_price: float = None, demand_trend: str = "Stable"):
        """
        Generates an explainable pricing strategy recommendation based on:
        - Profitability (COGS, Margin)
        - Market Gap & Competitors
        - Demand & Inventory
        - ML Predictions
        """
        # 1. Internal Financials & Inventory
        prod_stats = self.db.query(
            func.sum(Product.revenue).label("total_rev"),
            func.sum(Product.units_sold).label("total_units"),
            func.avg(Product.current_price).label("avg_price"),
            func.avg(Product.cost_price).label("avg_cost"),
            func.avg(Product.inventory_level).label("avg_inv"),
            func.avg(Product.demand_index).label("avg_demand")
        ).filter(Product.product_id == product_id).first()

        rev = float(prod_stats.total_rev or 0)
        units = int(prod_stats.total_units or 0)
        avg_cost = float(prod_stats.avg_cost or 0)
        
        if rev > 0 and units > 0:
            fin = calculate_financials(rev, units, avg_cost)
            margin_pct = fin["profit_margin_pct"]
            current_price = float(prod_stats.avg_price or 0)
            cost_price = fin["cost_price"]
        else:
            prod_cat = self.db.query(ProductCatalog).filter(ProductCatalog.product_id == product_id).first()
            if prod_cat:
                current_price = float(prod_cat.base_price or 0)
                cost_price = float(prod_cat.cost_price or 0)
                # Ensure the same exact calculation logic is applied for catalog fallback
                fin = calculate_financials(current_price, 1, cost_price)
                margin_pct = fin["profit_margin_pct"]
            else:
                current_price = 0
                cost_price = 0
                margin_pct = 0

        inventory = int(prod_stats.avg_inv or 0)
        demand_index = float(prod_stats.avg_demand or 100)

        # 2. External Market Data
        comps = self.db.query(CompetitorPriceHistory).filter(
            CompetitorPriceHistory.product_id == product_id,
            CompetitorPriceHistory.data_source != 'TEST_HISTORICAL'
        ).order_by(CompetitorPriceHistory.scraped_at.asc()).all()

        comp_prices = [float(c.price) for c in comps if c.price > 0]
        market_avg = sum(comp_prices)/len(comp_prices) if comp_prices else None
        
        gap_pct = ((current_price - market_avg) / market_avg * 100) if market_avg and current_price > 0 else 0

        # Competitor movement (latest vs previous)
        comp_movement = "Stable"
        if len(comp_prices) >= 2:
            latest = comp_prices[-1]
            prev = comp_prices[-2]
            if latest > prev * 1.02:
                comp_movement = "Increasing"
            elif latest < prev * 0.98:
                comp_movement = "Decreasing"

        # 3. ML Predictive Data
        forecast_trend = demand_trend

        # 4. Rules Engine Evaluation
        return self.evaluate_rules(
            current_price=current_price,
            cost_price=cost_price,
            margin_pct=margin_pct,
            market_avg=market_avg,
            gap_pct=gap_pct,
            comp_movement=comp_movement,
            inventory=inventory,
            demand_index=demand_index,
            forecast_trend=forecast_trend,
            ml_optimal_price=ml_optimal_price
        )

    @staticmethod
    def evaluate_rules(current_price, cost_price, margin_pct, market_avg, gap_pct, comp_movement, inventory, demand_index, forecast_trend, ml_optimal_price=None):
        action = "MAINTAIN PRICE"
        reason = "Current price is optimal given stable market conditions."
        key_factors = []
        
        # Insufficient Data Check
        if current_price == 0 or (market_avg is None and gap_pct == 0 and margin_pct == 0):
            action = "MONITOR MARKET"
            reason = "Insufficient financial and market data to generate a reliable pricing strategy."
            key_factors.append("Missing market or financial data")

        # Logic Matrix
        elif margin_pct < 15:
            if market_avg and gap_pct < -10 and forecast_trend == "Increasing":
                action = "PROTECT MARGIN"
                reason = "Profit margins are low, but increasing demand and a below-market price present an opportunity to slightly raise prices to protect margin without sacrificing volume."
                key_factors.append(f"Low Profit Margin ({margin_pct:.1f}%)")
                key_factors.append(f"Price is {abs(gap_pct):.1f}% below market average")
                key_factors.append("Demand is trending upward")
            else:
                action = "PROTECT MARGIN"
                reason = "Profit margins are critically low. Focus on reducing costs or slightly increasing price without losing volume."
                key_factors.append(f"Low Profit Margin ({margin_pct:.1f}%)")
                if market_avg and current_price < market_avg:
                    key_factors.append("Current price is below market average, allowing room for a price increase.")
        
        elif inventory > 200 and demand_index < 50:
            action = "CONSIDER PRICE DECREASE"
            reason = "High inventory and low demand detected. A price decrease could stimulate sales velocity to clear stock."
            key_factors.append(f"High Inventory ({inventory} units)")
            key_factors.append(f"Low Demand Index ({demand_index:.0f})")
            
        elif inventory < 50 and demand_index > 120:
            action = "CONSIDER PRICE INCREASE"
            reason = "Low inventory combined with high demand presents an opportunity to maximize profit margin."
            key_factors.append(f"Low Inventory ({inventory} units)")
            key_factors.append(f"High Demand Index ({demand_index:.0f})")
            
        elif market_avg and gap_pct > 10:
            action = "CONSIDER PRICE DECREASE"
            reason = "Price is significantly higher than the market average, risking loss of market share."
            key_factors.append(f"Price is {gap_pct:.1f}% above market average")
            
        elif market_avg and gap_pct < -10 and comp_movement == "Increasing":
            action = "CONSIDER PRICE INCREASE"
            reason = "Price is significantly below market and competitors are raising prices. Opportunity to increase margin while staying competitive."
            key_factors.append(f"Price is {abs(gap_pct):.1f}% below market average")
            key_factors.append("Competitor prices are trending upward")
            
        elif comp_movement == "Decreasing" and margin_pct > 25:
            action = "MONITOR MARKET"
            reason = "Competitors are lowering prices, but current healthy margins provide a buffer. Monitor closely before reacting."
            key_factors.append("Competitor prices are trending downward")
            key_factors.append(f"Healthy Profit Margin ({margin_pct:.1f}%)")

        return {
            "recommendation": action,
            "reason": reason,
            "key_factors": key_factors,
            "supporting_metrics": {
                "current_price": current_price,
                "cost_price": cost_price,
                "profit_margin_pct": round(margin_pct, 2) if margin_pct else 0,
                "market_average": round(market_avg, 2) if market_avg else None,
                "price_gap_pct": round(gap_pct, 2) if gap_pct else 0,
                "competitor_movement": comp_movement,
                "inventory_level": inventory,
                "demand_index": round(demand_index, 2) if demand_index else 100,
                "forecast_trend": forecast_trend,
                "ml_optimal_price": round(ml_optimal_price, 2) if ml_optimal_price else None
            }
        }
