import logging

logger = logging.getLogger("Recommendation")

def _fmt(val):
    """Format a number as Indian Rupees without library dependency."""
    try:
        return f"\u20b9{abs(float(val)):,.0f}"
    except Exception:
        return str(val)


class RecommendationEngine:
    def generate_recommendation(self, current_price: float, predicted_price: float, feature_dict: dict) -> dict:
        """
        Executes business rules to generate a recommendation, reasons grouped by impact, and revenue estimates.
        """
        difference = predicted_price - current_price
        percentage_change = (difference / current_price) * 100 if current_price else 0
        
        # 1. Recommendation Category
        if percentage_change > 5:
            recommendation = "Increase Price"
        elif percentage_change < -5:
            recommendation = "Decrease Price"
        else:
            recommendation = "Maintain Current Price"
            
        # 2. Revenue Impact
        units = feature_dict.get("units_sold", 100) # Use 100 as default volume if not found
        current_revenue = current_price * units
        expected_revenue = predicted_price * units
        gain = expected_revenue - current_revenue
        
        # 3. Categorized Business Reasons
        factors_increasing = []
        factors_reducing = []
        neutral_factors = []
        
        demand = feature_dict.get("demand_index", 100)
        inventory = feature_dict.get("inventory_level", 100)
        competitor = feature_dict.get("competitor_price", current_price)
        promo = feature_dict.get("promotion_type", "No Promotion")
        rating = feature_dict.get("average_rating", 4.0)
        lifecycle = feature_dict.get("product_lifecycle", "Maturity")
        brand = feature_dict.get("brand", "Unknown")
        sales = feature_dict.get("historical_sales", 100)
        base = feature_dict.get("base_price", current_price)
        
        # Demand
        if demand >= 80:
            factors_increasing.append({
                "title": "High Demand", 
                "label": "Demand Index = High", 
                "description": "Strong customer demand supports a higher selling price."
            })
        elif demand <= 40:
            factors_reducing.append({
                "title": "Low Demand", 
                "label": "Demand Index = Low", 
                "description": "Discounting recommended to stimulate sales volume."
            })
        else:
            neutral_factors.append({
                "title": "Stable Demand", 
                "label": "Demand Index = Normal", 
                "description": "Demand is currently stable."
            })
            
        # Inventory
        if inventory >= 150:
            factors_reducing.append({
                "title": "High Inventory", 
                "label": f"{inventory} units available", 
                "description": "Large stock limits how much the price can be increased."
            })
        elif inventory <= 50:
            factors_increasing.append({
                "title": "Low Inventory", 
                "label": f"{inventory} units available", 
                "description": "Scarcity allows for premium pricing to maximize margins."
            })
            
        # Competitor
        if competitor > current_price * 1.05:
            factors_increasing.append({
                "title": "Competitor Price Higher", 
                "label": f"Competitor Price = \u20b9{competitor:,.0f}", 
                "description": "We can safely increase our price while staying competitive."
            })
        elif competitor < current_price * 0.95:
            factors_reducing.append({
                "title": "Competitor Price Lower", 
                "label": f"Competitor Price = \u20b9{competitor:,.0f}", 
                "description": "Lowering price to maintain competitive edge."
            })
            
        # Sales
        if sales > 10000:
            factors_increasing.append({
                "title": "Strong Historical Sales", 
                "label": f"{sales} past sales", 
                "description": "This product has consistently sold well."
            })
            
        # Rating
        if rating >= 4.5:
            factors_increasing.append({
                "title": "Excellent Customer Rating", 
                "label": f"Average Rating = {rating}/5", 
                "description": "Highly rated products can command premium pricing."
            })
        elif rating < 3.0:
            factors_reducing.append({
                "title": "Poor Sentiment", 
                "label": f"Average Rating = {rating}/5", 
                "description": "Lowering price to offset poor reviews."
            })
            
        # Brand
        if brand.lower() in ["apple", "samsung", "sony", "premium"]:
            factors_increasing.append({
                "title": "Premium Brand", 
                "label": f"Brand = {brand}", 
                "description": "Premium brand positioning allows sustained premium pricing."
            })
            
        # Lifecycle
        if lifecycle in ["Growth", "Maturity"]:
            factors_increasing.append({
                "title": f"Product in {lifecycle} Stage", 
                "label": f"Lifecycle = {lifecycle}", 
                "description": "The product still has strong market demand."
            })
        elif lifecycle == "End of Life":
            factors_reducing.append({
                "title": "Aging Product", 
                "label": "Lifecycle = End of Life", 
                "description": "Clearance pricing required to liquidate."
            })
            
        # Promotion
        PROMO_CONFIG = {
            "Clearance": {
                "title": "Clearance Sale",
                "description": "Product is being cleared. A significant markdown is applied to liquidate stock quickly.",
                "impact_level": "High Impact",
                "impact_stars": "★★★★★"
            },
            "Flash Sale": {
                "title": "Flash Sale",
                "description": "Time-limited flash offer applies a steep discount to drive immediate purchases.",
                "impact_level": "High Impact",
                "impact_stars": "★★★★★"
            },
            "Festival Offer": {
                "title": "Festival Offer",
                "description": "Promotional pricing is applied to attract more customers during the campaign.",
                "impact_level": "Medium Impact",
                "impact_stars": "★★★☆☆"
            },
            "Percentage Discount": {
                "title": "Percentage Discount",
                "description": "A percentage-off promotion applies modest downward pressure on the final price.",
                "impact_level": "Medium Impact",
                "impact_stars": "★★★☆☆"
            },
            "Buy One Get One": {
                "title": "Buy One Get One",
                "description": "BOGO promotion reduces the effective unit price, limiting upward pricing flexibility.",
                "impact_level": "Medium Impact",
                "impact_stars": "★★★☆☆"
            },
            "Member Offer": {
                "title": "Member Offer",
                "description": "Loyalty discount provides a mild price reduction for existing members.",
                "impact_level": "Low Impact",
                "impact_stars": "★★☆☆☆"
            },
        }

        if promo in PROMO_CONFIG:
            cfg = PROMO_CONFIG[promo]
            factors_reducing.append({
                "title": cfg["title"],
                "label": f"Promotion = {promo}",
                "description": cfg["description"],
                "impact_level": cfg["impact_level"],
                "impact_stars": cfg["impact_stars"]
            })
        elif promo in ["None", "No Promotion", ""]:
            neutral_factors.append({
                "title": "No Promotion Active",
                "label": "Neutral",
                "description": "No promotional campaign is currently running for this product.",
                "impact_level": "Neutral",
                "impact_stars": "★☆☆☆☆"
            })
        else:
            # Unknown promotion type – treat as reducing factor for safety
            factors_reducing.append({
                "title": f"Active Promotion: {promo}",
                "label": f"Promotion = {promo}",
                "description": "An active promotional campaign applies downward pressure on the recommended price.",
                "impact_level": "Medium Impact",
                "impact_stars": "★★★☆☆"
            })
            
        # (Base Price is an internal ML reference, not meaningful to business users)

        # Synthesize Overall Decision Summary
        positives = [f['title'].lower() for f in factors_increasing]
        negatives = [f['title'].lower() for f in factors_reducing]

        overall = "The AI evaluated all pricing factors. "
        if recommendation == "Increase Price":
            if negatives:
                overall += (f"Although there are negative pressures (like {negatives[0]}), the product benefits from "
                           + " and ".join(positives[:2]) if positives else "favorable overall conditions"
                           + ". These positive factors have a stronger overall influence, allowing us to safely raise the price.")
            else:
                overall += "Market conditions are highly favorable across the board, supporting a price increase."
        elif recommendation == "Decrease Price":
            if positives:
                overall += (f"Although there are positive signals (like {positives[0]}), the product is facing "
                           + " and ".join(negatives[:2]) if negatives else "significant downward pressures"
                           + ". These negative factors have a stronger overall influence, requiring a price reduction.")
            else:
                overall += "Market conditions are unfavorable, requiring a discount to stimulate sales."
        else:
            if positives and negatives:
                overall += (f"There are competing pressures: {positives[0]} pushes the price up, while "
                           f"{negatives[0]} pulls it down. These factors balance out, resulting in no significant price change.")
            else:
                overall += "The prevailing market factors are not strong enough to warrant a significant price change."

        # Generate the full per-feature factor analysis table
        pricing_factors = self.generate_pricing_factors(current_price, predicted_price, feature_dict)

        # Concise recommendation_reason (single sentence for quick reference)
        if recommendation == "Increase Price":
            summary = f"The AI recommends increasing the price by {_fmt(difference)} ({percentage_change:.1f}%). {overall}"
        elif recommendation == "Decrease Price":
            summary = f"The AI recommends decreasing the price by {_fmt(abs(difference))} ({abs(percentage_change):.1f}%). {overall}"
        else:
            summary = f"The AI recommends maintaining the current price. {overall}"

        return {
            "recommendation": recommendation,
            "recommendation_reason": summary,

            "overall_decision_summary": overall,
            "factors_increasing": factors_increasing,
            "factors_reducing": factors_reducing,
            "neutral_factors": neutral_factors,
            "pricing_factors": pricing_factors,
            "current_revenue": current_revenue,
            "expected_revenue": expected_revenue,
            "revenue_impact": gain
        }

    def generate_pricing_factors(self, current_price: float, predicted_price: float, feature_dict: dict) -> list:
        """
        Returns a comprehensive ordered list of all pricing factors with
        their current value, effect direction, and business-friendly explanation.
        No ML internals are exposed — only business-readable data.
        """
        factors = []

        brand      = feature_dict.get("brand", "Unknown")
        category   = feature_dict.get("category", "General")
        cost_price = feature_dict.get("cost_price", 0)
        competitor = feature_dict.get("competitor_price", current_price)
        demand     = feature_dict.get("demand_index", 100)
        inventory  = feature_dict.get("inventory_level", 100)
        promo      = feature_dict.get("promotion_type", "No Promotion")
        sales      = feature_dict.get("historical_sales", 0)
        rating     = feature_dict.get("average_rating", 4.0)
        lifecycle  = feature_dict.get("product_lifecycle", "Maturity")
        season     = feature_dict.get("season", "Unknown")
        category_s = str(category)

        # ── 1. Brand ──────────────────────────────────────────────────────────
        PREMIUM_BRANDS = ["apple", "samsung", "sony", "louis vuitton", "gucci",
                          "coach", "bose", "nike", "adidas", "fossil", "armani"]
        brand_lower = str(brand).lower()
        if any(pb in brand_lower for pb in PREMIUM_BRANDS):
            factors.append({"feature": "Brand", "value": brand, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"{brand} is a recognized premium brand. Customers are generally willing to pay a higher price, supporting sustained premium pricing."})
        else:
            factors.append({"feature": "Brand", "value": brand, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"{brand} is not classified as a premium brand. Pricing depends more on demand, competition, and product performance."})

        # ── 2. Category ───────────────────────────────────────────────────────
        PREMIUM_CATS = ["electronics", "luxury", "furniture", "jewellery"]
        DISCOUNT_CATS = ["groceries", "daily essentials"]
        cat_lower = category_s.lower()
        if any(c in cat_lower for c in PREMIUM_CATS):
            factors.append({"feature": "Category", "value": category_s, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"{category_s} products typically command premium pricing due to higher perceived value and technology investment."})
        elif any(c in cat_lower for c in DISCOUNT_CATS):
            factors.append({"feature": "Category", "value": category_s, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"{category_s} are price-sensitive commodity products. Margins are thin and pricing must stay competitive."})
        else:
            factors.append({"feature": "Category", "value": category_s, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"{category_s} pricing is influenced more by demand and competition than by category alone."})

        # ── 3. Cost Price ─────────────────────────────────────────────────────
        if cost_price and cost_price > 0:
            margin_pct = ((predicted_price - cost_price) / cost_price) * 100 if cost_price else 0
            factors.append({"feature": "Cost Price", "value": f"\u20b9{cost_price:,.0f}", "effect": "reference",
                "effect_label": "Reference",
                "reason": f"The AI-recommended price is {margin_pct:.1f}% above the product cost, ensuring profitability on every unit sold."})

        # ── 4. Current Selling Price ──────────────────────────────────────────
        factors.append({"feature": "Current Selling Price", "value": f"\u20b9{current_price:,.0f}", "effect": "reference",
            "effect_label": "Reference",
            "reason": "Acts as the primary pricing baseline. The AI recommendation is calculated as a multiplier applied to this price."})

        # ── 5. Competitor Price ───────────────────────────────────────────────
        if competitor and current_price:
            comp_diff_pct = ((competitor - current_price) / current_price) * 100
            comp_diff_amt = competitor - current_price
            if comp_diff_pct > 5:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} ({abs(comp_diff_pct):.1f}% Higher)",
                    "effect": "positive", "effect_label": "Positive (+)",
                    "reason": f"Competitors are selling at \u20b9{abs(comp_diff_amt):,.0f} more than our current price. There is room to increase our price while remaining competitive."})
            elif comp_diff_pct < -5:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} ({abs(comp_diff_pct):.1f}% Lower)",
                    "effect": "negative", "effect_label": "Negative (-)",
                    "reason": f"Competitors are selling at \u20b9{abs(comp_diff_amt):,.0f} less than our current price. Large price increases may reduce competitiveness."})
            else:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} (Similar Price)",
                    "effect": "neutral", "effect_label": "Neutral",
                    "reason": "Competitor pricing is very close to ours. Pricing decisions should rely more on demand, inventory, and product performance."})

        # ── 6. Demand Index ───────────────────────────────────────────────────
        if demand >= 120:
            demand_label = "Very High"
        elif demand >= 80:
            demand_label = "High"
        elif demand >= 50:
            demand_label = "Moderate"
        elif demand >= 30:
            demand_label = "Low"
        else:
            demand_label = "Very Low"

        if demand >= 80:
            factors.append({"feature": "Demand", "value": demand_label, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"High customer demand ({demand_label}) allows premium pricing. Products in high demand have strong selling power."})
        elif demand <= 40:
            factors.append({"feature": "Demand", "value": demand_label, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"Lower customer demand ({demand_label}) suggests reducing price to improve sales velocity and prevent stock build-up."})
        else:
            factors.append({"feature": "Demand", "value": demand_label, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"Demand is moderate ({demand_label}). Pricing should be guided by competitive positioning rather than scarcity alone."})

        # ── 7. Inventory Level ────────────────────────────────────────────────
        if inventory <= 50:
            inv_label = f"{inventory} Units (Low)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"Low inventory ({inventory} units) indicates scarcity. Scarcity typically allows for a higher selling price."})
        elif inventory >= 150:
            inv_label = f"{inventory} Units (High)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"High inventory ({inventory} units) creates selling pressure. Pricing must be competitive to move stock and prevent excess build-up."})
        else:
            inv_label = f"{inventory} Units (Normal)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"Inventory levels are within a normal range ({inventory} units). No significant upward or downward pricing pressure from stock levels."})

        # ── 8. Promotion Type ─────────────────────────────────────────────────
        PROMO_REASONS = {
            "No Promotion":        ("reference", "Reference",   "No promotional campaign is active. Pricing is based purely on market conditions."),
            "Clearance":           ("negative",  "Negative (-)", "Product is being cleared. A significant markdown must be applied to liquidate stock quickly."),
            "Flash Sale":          ("negative",  "Negative (-)", "Time-limited flash offer. A steep discount is applied to drive immediate purchases."),
            "Festival Offer":      ("negative",  "Negative (-)", "Promotional pricing is applied to attract more customers during the festival campaign."),
            "Percentage Discount": ("negative",  "Negative (-)", "A percentage-off promotion applies downward pressure on the final recommended price."),
            "Buy One Get One":     ("negative",  "Negative (-)", "BOGO promotion reduces the effective unit price, limiting upward pricing flexibility."),
            "Member Offer":        ("negative",  "Negative (-)", "Loyalty discount provides a mild price reduction to reward existing members."),
        }
        promo_cfg = PROMO_REASONS.get(promo, ("negative", "Negative (-)", f"An active promotional campaign ({promo}) applies downward pressure on pricing."))
        factors.append({"feature": "Promotion", "value": promo, "effect": promo_cfg[0],
            "effect_label": promo_cfg[1], "reason": promo_cfg[2]})

        # ── 9. Historical Sales ───────────────────────────────────────────────
        if sales == 0:
            factors.append({"feature": "Historical Sales", "value": "Not Available", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "New product has no historical sales yet."})
        elif sales > 10000:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"The product has a strong sales history ({int(sales):,} units). Proven demand supports confident premium pricing."})
        elif sales < 7000:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"Historical sales are below average ({int(sales):,} units). A competitive price may be needed to improve market performance."})
        else:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"Historical sales are at a normal level ({int(sales):,} units), with no strong directional pricing signal."})

        # ── 10. Average Rating ────────────────────────────────────────────────
        if rating == 0:
            factors.append({"feature": "Average Rating", "value": "Not Available", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "No customer reviews yet."})
        elif rating >= 4.5:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": f"An excellent customer rating of {rating:.1f}/5 reflects high satisfaction. Highly-rated products can sustain a small price premium."})
        elif rating < 3.0:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"A below-average rating of {rating:.1f}/5 may deter buyers. A lower price may be necessary to offset poor reviews."})
        else:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"A solid rating of {rating:.1f}/5 is acceptable. No significant premium or discount pressure from customer sentiment."})

        # ── 11. Product Lifecycle ─────────────────────────────────────────────
        LIFECYCLE_MAP = {
            "Introduction": ("positive", "Positive (+)",
                "New products generally command launch pricing premiums. Customers expect to pay more for the latest releases."),
            "Growth":       ("positive", "Positive (+)",
                "The product is in a growth phase with rising market acceptance. Strong pricing power is supported."),
            "Maturity":     ("neutral",  "Neutral",
                "The product is in its maturity stage. Pricing is typically stable with modest competitive adjustments."),
            "End of Life":  ("negative", "Negative (-)",
                "Older products usually require discounts to maintain sales. Customers may prefer newer alternatives."),
        }
        lc_cfg = LIFECYCLE_MAP.get(lifecycle, ("neutral", "Neutral", f"Lifecycle stage '{lifecycle}' has a neutral pricing impact."))
        factors.append({"feature": "Product Lifecycle", "value": lifecycle, "effect": lc_cfg[0],
            "effect_label": lc_cfg[1], "reason": lc_cfg[2]})

        # ── 12. Season ────────────────────────────────────────────────────────
        SEASONAL_APPAREL = ["apparel", "clothing", "fashion", "shoes", "footwear"]
        is_apparel = any(s in category_s.lower() for s in SEASONAL_APPAREL)
        if season == "Winter" and is_apparel:
            factors.append({"feature": "Season", "value": season, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "Winter season significantly increases demand for Apparel products, supporting a higher selling price."})
        elif season in ["Summer", "Monsoon"] and is_apparel:
            factors.append({"feature": "Season", "value": season, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": f"{season} season typically reduces demand for Apparel. Discounting may be needed to move inventory."})
        else:
            factors.append({"feature": "Season", "value": season, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": f"The current {season} season does not have a significant directional impact on pricing for this product category."})

        return factors


recommendation_engine = RecommendationEngine()

