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
            
        # 2. Revenue Impact (based on full inventory projection)
        inventory = feature_dict.get("inventory_level", 100)
        current_revenue = current_price * inventory
        expected_revenue = predicted_price * inventory
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
        cost_price = feature_dict.get("cost_price", 0)
        total_inventory_cost = cost_price * inventory
        
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

        overall = ""
        if recommendation == "Increase Price":
            if negatives:
                overall = f"Upward factors (like {positives[0] if positives else 'demand'}) outweigh downward pressures, allowing a price increase."
            else:
                overall = "Market conditions are highly favorable, supporting a price increase."
        elif recommendation == "Decrease Price":
            if positives:
                overall = f"Downward pressures (like {negatives[0] if negatives else 'inventory'}) outweigh positive factors, requiring a price reduction."
            else:
                overall = "Market conditions are unfavorable, requiring a discount to stimulate sales."
        else:
            if positives and negatives:
                overall = "Positive and negative factors balance out, resulting in no change."
            else:
                overall = "Market factors are too weak to justify a price change."

        # Generate the full per-feature factor analysis table
        pricing_factors = self.generate_pricing_factors(current_price, predicted_price, feature_dict)

        # Concise recommendation_reason (single sentence for quick reference)
        if recommendation == "Increase Price":
            summary = f"Recommended +{percentage_change:.1f}% increase. {overall}"
        elif recommendation == "Decrease Price":
            summary = f"Recommended -{abs(percentage_change):.1f}% decrease. {overall}"
        else:
            summary = f"Maintain price. {overall}"

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
            "revenue_impact": gain,
            "total_inventory_cost": total_inventory_cost
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
                "reason": "Premium brand allows a higher price."})
        else:
            factors.append({"feature": "Brand", "value": brand, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Brand has no significant directional impact in this prediction."})

        # ── 2. Category ───────────────────────────────────────────────────────
        PREMIUM_CATS = ["electronics", "luxury", "furniture", "jewellery"]
        DISCOUNT_CATS = ["groceries", "daily essentials"]
        cat_lower = category_s.lower()
        if any(c in cat_lower for c in PREMIUM_CATS):
            factors.append({"feature": "Category", "value": category_s, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "High-value category supports a higher price."})
        elif any(c in cat_lower for c in DISCOUNT_CATS):
            factors.append({"feature": "Category", "value": category_s, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "Price-sensitive category. Must stay competitive."})
        else:
            factors.append({"feature": "Category", "value": category_s, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Standard category. Pricing relies on demand."})

        # ── 3. Cost Price ─────────────────────────────────────────────────────
        if cost_price and cost_price > 0:
            factors.append({"feature": "Cost Price", "value": f"\u20b9{cost_price:,.0f}", "effect": "reference",
                "effect_label": "Reference",
                "reason": "Reference value used to enforce the minimum profitable price."})

        # ── 4. Current Selling Price ──────────────────────────────────────────
        factors.append({"feature": "Current Selling Price", "value": f"\u20b9{current_price:,.0f}", "effect": "reference",
            "effect_label": "Reference",
            "reason": "Baseline for calculating the new price."})

        # ── 5. Competitor Price ───────────────────────────────────────────────
        if competitor and current_price:
            comp_diff_pct = ((competitor - current_price) / current_price) * 100
            comp_diff_amt = competitor - current_price
            if comp_diff_pct > 5:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} ({abs(comp_diff_pct):.1f}% Higher)",
                    "effect": "positive", "effect_label": "Positive (+)",
                    "reason": "Competitors charge more. We can increase price."})
            elif comp_diff_pct < -5:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} ({abs(comp_diff_pct):.1f}% Lower)",
                    "effect": "negative", "effect_label": "Negative (-)",
                    "reason": "Competitors charge less. Large increases risk sales."})
            else:
                factors.append({"feature": "Competitor Price", "value": f"\u20b9{competitor:,.0f} (Similar Price)",
                    "effect": "neutral", "effect_label": "Neutral",
                    "reason": "Similar to competitors. Price is competitive."})

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
                "reason": "High demand supports a price increase."})
        elif demand <= 40:
            factors.append({"feature": "Demand", "value": demand_label, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "Low demand. Consider discounting to boost sales."})
        else:
            factors.append({"feature": "Demand", "value": demand_label, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Stable demand. No major price pressure."})

        # ── 7. Inventory Level ────────────────────────────────────────────────
        if inventory <= 50:
            inv_label = f"{inventory} Units (Low)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "Low stock. Scarcity supports a higher price."})
        elif inventory >= 150:
            inv_label = f"{inventory} Units (High)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "High stock. Must stay competitive to move units."})
        else:
            inv_label = f"{inventory} Units (Normal)"
            factors.append({"feature": "Inventory", "value": inv_label, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Normal stock levels. No pricing pressure."})

        # ── 8. Promotion Type ─────────────────────────────────────────────────
        PROMO_REASONS = {
            "No Promotion":        ("reference", "Reference",   "No active promotion. Pricing is based on market conditions."),
            "Clearance":           ("negative",  "Negative (-)", "Clearance sale requires steep discounts to liquidate stock."),
            "Flash Sale":          ("negative",  "Negative (-)", "Flash sale requires steep discounts for immediate purchases."),
            "Festival Offer":      ("negative",  "Negative (-)", "Festival offer lowers the target price to attract customers."),
            "Percentage Discount": ("negative",  "Negative (-)", "Active discount lowers the target price."),
            "Buy One Get One":     ("negative",  "Negative (-)", "BOGO lowers effective unit price, limiting increases."),
            "Member Offer":        ("negative",  "Negative (-)", "Member discount applies a small price reduction."),
        }
        promo_cfg = PROMO_REASONS.get(promo, ("negative", "Negative (-)", "Active promotion lowers the target price."))
        factors.append({"feature": "Promotion", "value": promo, "effect": promo_cfg[0],
            "effect_label": promo_cfg[1], "reason": promo_cfg[2]})

        # ── 9. Historical Sales ───────────────────────────────────────────────
        if sales == 0:
            factors.append({"feature": "Historical Sales", "value": "Not Available", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "New product. No historical sales."})
        elif sales > 10000:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "Strong sales history supports a premium."})
        elif sales < 7000:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "Low past sales. Needs competitive pricing."})
        else:
            factors.append({"feature": "Historical Sales", "value": f"{int(sales):,} Units", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Normal sales history. No major impact."})

        # ── 10. Average Rating ────────────────────────────────────────────────
        if rating == 0:
            factors.append({"feature": "Average Rating", "value": "Not Available", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "No customer reviews yet."})
        elif rating >= 4.5:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "Excellent reviews support a price premium."})
        elif rating < 3.0:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "Poor reviews limit price increases."})
        else:
            factors.append({"feature": "Average Rating", "value": f"{rating:.1f} / 5", "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Solid reviews. No major pricing impact."})

        # ── 11. Product Lifecycle ─────────────────────────────────────────────
        LIFECYCLE_MAP = {
            "Introduction": ("positive", "Positive (+)", "Newer product supports higher launch pricing."),
            "Growth":       ("positive", "Positive (+)", "Growing market acceptance supports premium pricing."),
            "Maturity":     ("neutral",  "Neutral",      "Mature product. Stable pricing recommended."),
            "End of Life":  ("negative", "Negative (-)", "Older product. Discounts needed to clear stock."),
        }
        lc_cfg = LIFECYCLE_MAP.get(lifecycle, ("neutral", "Neutral", f"{lifecycle} lifecycle has no significant directional impact in this prediction."))
        factors.append({"feature": "Product Lifecycle", "value": lifecycle, "effect": lc_cfg[0],
            "effect_label": lc_cfg[1], "reason": lc_cfg[2]})

        # ── 12. Season ────────────────────────────────────────────────────────
        SEASONAL_APPAREL = ["apparel", "clothing", "fashion", "shoes", "footwear"]
        is_apparel = any(s in category_s.lower() for s in SEASONAL_APPAREL)
        if season == "Winter" and is_apparel:
            factors.append({"feature": "Season", "value": season, "effect": "positive",
                "effect_label": "Positive (+)",
                "reason": "High seasonal demand allows price increase."})
        elif season in ["Summer", "Monsoon"] and is_apparel:
            factors.append({"feature": "Season", "value": season, "effect": "negative",
                "effect_label": "Negative (-)",
                "reason": "Low seasonal demand requires competitive pricing."})
        else:
            factors.append({"feature": "Season", "value": season, "effect": "neutral",
                "effect_label": "Neutral",
                "reason": "Season has no significant directional impact in this prediction."})

        return factors


recommendation_engine = RecommendationEngine()

