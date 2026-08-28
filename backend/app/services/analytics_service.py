from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from app.models.product import Product

def get_category_average_revenue(db: Session):
    # Helper to calculate average revenue per category
    cats = db.query(
        Product.category,
        func.avg(Product.revenue).label("avg_cat_revenue")
    ).group_by(Product.category).all()
    return {c.category: float(c.avg_cat_revenue or 0) for c in cats}

def generate_business_alerts(db: Session):
    alerts = []
    
    low_inv = db.query(Product).filter(Product.inventory_level < 10).count()
    if low_inv > 0:
        alerts.append({
            "id": "low_inventory",
            "type": "Critical",
            "message": "Products have critically low inventory (<10 units).",
            "count": low_inv,
            "action": "Review Inventory Analysis",
            "section": "inventory"
        })
        
    high_disc = db.query(Product).filter(Product.discount_pct > 30).count()
    if high_disc > 0:
        alerts.append({
            "id": "high_discount",
            "type": "High",
            "message": "Products are currently running discounts >30%.",
            "count": high_disc,
            "action": "Review Product Performance",
            "section": "performance"
        })

    dead_stock = db.query(Product).filter(
        and_(Product.units_sold == 0, Product.inventory_level > 100)
    ).count()
    if dead_stock > 0:
        alerts.append({
            "id": "dead_stock",
            "type": "Medium",
            "message": "Products have high inventory but 0 units sold.",
            "count": dead_stock,
            "action": "Review Inventory Analysis",
            "section": "inventory"
        })

    return alerts

def get_product_performance(db: Session):
    results = db.query(
        Product.product_id,
        func.max(Product.category).label("category"),
        func.max(Product.brand).label("brand"),
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_price"),
        func.avg(Product.discount_pct).label("avg_discount"),
        func.avg(Product.inventory_level).label("avg_inventory")
    ).filter(Product.product_id.isnot(None))\
     .group_by(Product.product_id)\
     .order_by(desc("total_revenue"))\
     .all()

    data = []
    for r in results:
        rev = float(r.total_revenue or 0)
        units = int(r.total_units or 0)
        inv = int(r.avg_inventory or 0)
        discount = float(r.avg_discount or 0)
        
        status = "Healthy"
        priority = "Low"
        recommendation = "No Action Required"

        if inv < 10 and units > 50:
            status = "Stockout Risk"
            priority = "High"
            recommendation = "Restock"
        elif discount > 30 and rev < 1000:
            status = "Margin Erosion"
            priority = "High"
            recommendation = "Reduce Discount"
        elif discount > 20 and rev < 5000:
            status = "Underperforming Promo"
            priority = "Medium"
            recommendation = "Review Pricing"
        elif inv > 200 and units < 10:
            status = "Dead Stock"
            priority = "Medium"
            recommendation = "Monitor Product"
        elif units > 200 and discount == 0:
            status = "High Demand"
            priority = "Low"
            recommendation = "Maintain Price"

        data.append({
            "product_id": r.product_id,
            "category": r.category or "N/A",
            "brand": r.brand or "N/A",
            "revenue": rev,
            "units_sold": units,
            "inventory": inv,
            "avg_price": float(r.avg_price or 0),
            "discount": discount,
            "status": status,
            "priority": priority,
            "recommendation": recommendation
        })
    return data

def get_profitability_analysis(db: Session):
    from app.models.product_catalog import ProductCatalog
    from app.models.product import Product
    from app.utils.financials import calculate_financials, get_risk_status
    import datetime

    # 1. Product & Category Profitability
    product_query = db.query(
        ProductCatalog.product_id,
        ProductCatalog.product_name,
        ProductCatalog.category,
        func.sum(Product.revenue).label("total_rev"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.cost_price).label("avg_cost")
    ).outerjoin(Product, ProductCatalog.product_id == Product.product_id).group_by(
        ProductCatalog.id, ProductCatalog.product_id, ProductCatalog.product_name, ProductCatalog.category
    ).all()

    products_data = []
    category_agg = {}
    
    total_business_rev = 0
    total_business_cogs = 0
    total_business_units = 0
    total_eligible_prods = len(product_query)
    profitable_prods = 0
    
    risk_counts = {
        "High Risk": 0, "At Risk": 0, "Healthy": 0, "High Margin": 0,
        "Zero Profit": 0, "Negative Profit": 0, "Insufficient Data": 0
    }

    for p in product_query:
        fin = calculate_financials(p.total_rev, p.total_units, p.avg_cost)
        
        # Determine strict risk status
        if fin["revenue"] == 0 and fin["units_sold"] == 0:
            status = "Insufficient Data"
        elif fin["gross_profit"] < 0:
            status = "Negative Profit"
        elif fin["gross_profit"] == 0 and fin["revenue"] > 0:
            status = "Zero Profit"
        else:
            status = get_risk_status(fin["profit_margin_pct"])
            
        risk_counts[status] = risk_counts.get(status, 0) + 1
        
        if fin["gross_profit"] > 0:
            profitable_prods += 1
            
        # Accumulate business totals
        total_business_rev += fin["revenue"]
        total_business_cogs += fin["cogs"]
        total_business_units += fin["units_sold"]
        
        # Category aggregation
        cat = p.category or "Uncategorized"
        if cat not in category_agg:
            category_agg[cat] = {"revenue": 0, "cogs": 0, "units_sold": 0}
        category_agg[cat]["revenue"] += fin["revenue"]
        category_agg[cat]["cogs"] += fin["cogs"]
        category_agg[cat]["units_sold"] += fin["units_sold"]

        products_data.append({
            "product_id": p.product_id,
            "product_name": p.product_name,
            "category": cat,
            **fin,
            "status": status
        })

    # Overall KPIs
    overall_gross_profit = total_business_rev - total_business_cogs
    overall_margin = (overall_gross_profit / total_business_rev * 100) if total_business_rev > 0 else 0
    overall_asp = (total_business_rev / total_business_units) if total_business_units > 0 else 0
    cogs_pct = (total_business_cogs / total_business_rev * 100) if total_business_rev > 0 else 0
    profitability_rate = (profitable_prods / total_eligible_prods * 100) if total_eligible_prods > 0 else 0
    
    overview = {
        "total_revenue": total_business_rev,
        "total_cogs": total_business_cogs,
        "gross_profit": overall_gross_profit,
        "avg_margin": overall_margin,
        "units_sold": total_business_units,
        "profitability_rate": profitability_rate,
        "risk_products": risk_counts["High Risk"] + risk_counts["At Risk"],
        "asp": overall_asp,
        "cogs_pct": cogs_pct,
        "total_analyzed": total_eligible_prods
    }

    # Format category data
    categories_data = []
    for cat, data in category_agg.items():
        cat_gp = data["revenue"] - data["cogs"]
        cat_margin = (cat_gp / data["revenue"] * 100) if data["revenue"] > 0 else 0
        cat_contrib = (cat_gp / overall_gross_profit * 100) if overall_gross_profit > 0 else 0
        categories_data.append({
            "category": cat,
            "revenue": data["revenue"],
            "cogs": data["cogs"],
            "gross_profit": cat_gp,
            "margin_pct": cat_margin,
            "units_sold": data["units_sold"],
            "profit_contribution_pct": cat_contrib
        })

    # Insights Generation
    insights = {}
    if categories_data:
        sorted_cat_gp = sorted(categories_data, key=lambda x: x["gross_profit"], reverse=True)
        sorted_cat_margin = sorted([c for c in categories_data if c["revenue"] > 1000], key=lambda x: x["margin_pct"], reverse=True)
        
        insights["highest_profit_category"] = sorted_cat_gp[0]["category"]
        insights["lowest_profit_category"] = sorted_cat_gp[-1]["category"]
        insights["highest_margin_category"] = sorted_cat_margin[0]["category"] if sorted_cat_margin else "N/A"
        insights["lowest_margin_category"] = sorted_cat_margin[-1]["category"] if sorted_cat_margin else "N/A"
        
    if products_data:
        sorted_prod_gp = sorted(products_data, key=lambda x: x["gross_profit"], reverse=True)
        insights["most_profitable_product"] = sorted_prod_gp[0]["product_id"]
        insights["lowest_profit_product"] = sorted_prod_gp[-1]["product_id"]
        
        top_10_rev = sum([p["revenue"] for p in sorted(products_data, key=lambda x: x["revenue"], reverse=True)[:10]])
        top_10_gp = sum([p["gross_profit"] for p in sorted_prod_gp[:10]])
        top_10_cogs = sum([p["cogs"] for p in sorted(products_data, key=lambda x: x["cogs"], reverse=True)[:10]])
        
        insights["revenue_concentration_top_10"] = (top_10_rev / total_business_rev * 100) if total_business_rev > 0 else 0
        insights["profit_concentration_top_10"] = (top_10_gp / overall_gross_profit * 100) if overall_gross_profit > 0 else 0
        insights["cogs_concentration_top_10"] = (top_10_cogs / total_business_cogs * 100) if total_business_cogs > 0 else 0
        insights["margin_risk_exposure"] = risk_counts["High Risk"] + risk_counts["At Risk"]

    # Trend Analysis
    max_date = db.query(func.max(Product.date)).scalar()
    trends = {"7D": [], "30D": [], "90D": []}
    
    if max_date:
        for period_days, key in [(7, "7D"), (30, "30D"), (90, "90D")]:
            start_date = max_date - datetime.timedelta(days=period_days)
            trend_query = db.query(
                Product.date,
                func.sum(Product.revenue).label("rev"),
                func.sum(Product.units_sold).label("units"),
                func.avg(Product.cost_price).label("cost")
            ).filter(Product.date > start_date).group_by(Product.date).order_by(Product.date).all()
            
            for row in trend_query:
                t_rev = float(row.rev or 0)
                t_units = int(row.units or 0)
                t_cost = float(row.cost or 0)
                t_cogs = t_units * t_cost
                t_gp = t_rev - t_cogs
                t_margin = (t_gp / t_rev * 100) if t_rev > 0 else 0
                trends[key].append({
                    "date": str(row.date.date()) if row.date else None,
                    "revenue": t_rev,
                    "cogs": t_cogs,
                    "gross_profit": t_gp,
                    "margin_pct": t_margin
                })
                
    if trends["30D"]:
        start_gp = trends["30D"][0]["gross_profit"]
        end_gp = trends["30D"][-1]["gross_profit"]
        if end_gp > start_gp * 1.05:
            insights["trend_insight"] = "Gross profit increased over the last 30 days."
        elif end_gp < start_gp * 0.95:
            insights["trend_insight"] = "Gross profit decreased over the last 30 days."
        else:
            insights["trend_insight"] = "Gross profit remained relatively stable over the last 30 days."
    else:
        insights["trend_insight"] = "Insufficient trend data."

    return {
        "overview": overview,
        "products": products_data,
        "categories": categories_data,
        "risk": risk_counts,
        "trends": trends,
        "insights": insights
    }

def get_promotion_analysis(db: Session):
    cat_avg = get_category_average_revenue(db)
    
    results = db.query(
        Product.promotion_type,
        func.max(Product.category).label("sample_category"),
        func.count(func.distinct(Product.product_id)).label("products_covered"),
        func.avg(Product.discount_pct).label("avg_discount"),
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units")
    ).filter(Product.promotion_type.isnot(None), Product.promotion_type != 'None')\
     .group_by(Product.promotion_type)\
     .order_by(desc("total_revenue"))\
     .all()

    data = []
    for r in results:
        rev = float(r.total_revenue or 0)
        discount = float(r.avg_discount or 0)
        category = r.sample_category
        avg_cat_rev = cat_avg.get(category, 0)
        
        impact = "Normal"
        recommendation = "Monitor"

        # Specific deterministic rules
        if discount > 30 and rev < avg_cat_rev:
            impact = "Inefficient"
            recommendation = "Reduce Discount"
        elif discount < 10 and rev > avg_cat_rev * 1.5:
            impact = "Optimal"
            recommendation = "Promotion Performing Well"
        elif discount > 30 and rev > avg_cat_rev * 1.5:
            impact = "Review"
            recommendation = "Review Profitability after ML"
        elif rev > avg_cat_rev:
            impact = "Good"
            recommendation = "Maintain Promotion"

        data.append({
            "promotion_type": r.promotion_type,
            "products_covered": int(r.products_covered or 0),
            "avg_discount": discount,
            "revenue": rev,
            "units_sold": int(r.total_units or 0),
            "business_impact": impact,
            "recommendation": recommendation
        })
    return data

def get_regional_performance(db: Session):
    results = db.query(
        Product.region,
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_price")
    ).filter(Product.region.isnot(None), Product.region != 'None')\
     .group_by(Product.region)\
     .order_by(desc("total_revenue"))\
     .all()

    data = []
    for r in results:
        rev = float(r.total_revenue or 0)
        units = int(r.total_units or 0)
        
        observation = "Stable Market"
        recommendation = "Monitor Region"
        
        if units > 5000:
            observation = "High Sales"
            recommendation = "Increase Inventory"
        elif rev < 10000:
            observation = "Needs Review"
            recommendation = "Review Pricing"

        data.append({
            "region": r.region,
            "revenue": rev,
            "units_sold": units,
            "avg_price": float(r.avg_price or 0),
            "observation": observation,
            "recommendation": recommendation
        })
    return data

def get_inventory_analysis(db: Session):
    results = db.query(
        Product.product_id,
        func.max(Product.category).label("category"),
        func.max(Product.brand).label("brand"),
        func.avg(Product.inventory_level).label("avg_inventory"),
        func.sum(Product.units_sold).label("total_units")
    ).filter(Product.product_id.isnot(None))\
     .group_by(Product.product_id)\
     .all()

    data = []
    for r in results:
        inv = int(r.avg_inventory or 0)
        units = int(r.total_units or 0)
        
        status = "Healthy"
        priority = "Low"
        recommendation = "No Action Required"
        
        if inv < 10 and units > 20:
            status = "Critically Low"
            priority = "High"
            recommendation = "Immediate Restock"
        elif inv < 50:
            status = "Low Stock"
            priority = "Medium"
            recommendation = "Prepare Purchase Order"
        elif inv > 300 and units < 10:
            status = "Overstocked"
            priority = "High"
            recommendation = "Clearance Promotion"

        data.append({
            "product_id": r.product_id,
            "category": r.category or "N/A",
            "brand": r.brand or "N/A",
            "inventory": inv,
            "units_sold": units,
            "status": status,
            "priority": priority,
            "recommendation": recommendation
        })
    # Sort so issues appear first
    data.sort(key=lambda x: 0 if x['priority'] == 'High' else (1 if x['priority'] == 'Medium' else 2))
    return data

def get_revenue_analysis(db: Session):
    results = db.query(
        Product.product_id,
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_price"),
        func.max(Product.category).label("category"),
        func.max(Product.brand).label("brand")
    ).filter(Product.product_id.isnot(None))\
     .group_by(Product.product_id)\
     .all()

    data = []
    for r in results:
        data.append({
            "product_id": r.product_id,
            "revenue": float(r.total_revenue or 0),
            "units_sold": int(r.total_units or 0),
            "avg_price": float(r.avg_price or 0),
            "category": r.category or "N/A",
            "brand": r.brand or "N/A",
        })
    return data


def get_strategy_distribution_all_products(db, return_raw=False):
    """
    Evaluates pricing strategy rules for ALL eligible catalog products using
    bulk SQL queries - no N+1 DB queries.
    Uses demand_predictor for ML trend. Skips XGBoost optimal price for performance.
    """
    from app.models.product_catalog import ProductCatalog
    from app.models.competitor_price import CompetitorPriceHistory
    from app.utils.financials import calculate_financials as cf
    from sqlalchemy import func

    prod_stats_q = db.query(
        Product.product_id,
        func.sum(Product.revenue).label("total_rev"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_price"),
        func.avg(Product.cost_price).label("avg_cost"),
        func.avg(Product.inventory_level).label("avg_inv"),
        func.avg(Product.demand_index).label("avg_demand"),
    ).group_by(Product.product_id).all()
    prod_financial_map = {p.product_id: p for p in prod_stats_q}

    catalog_products = db.query(ProductCatalog).all()
    catalog_map = {p.product_id: p for p in catalog_products}

    raw_strategies = []

    # Get ML Demand Trends in a single fast batch query (~0.5s)
    from ml.demand_predictor import demand_predictor
    try:
        batch_trends = demand_predictor.predict_batch_trend(30)
    except Exception:
        batch_trends = {}

    all_comps = db.query(CompetitorPriceHistory).filter(
        CompetitorPriceHistory.data_source != 'TEST_HISTORICAL'
    ).order_by(CompetitorPriceHistory.scraped_at.asc()).all()

    comp_by_product = {}
    for c in all_comps:
        pid = c.product_id
        if pid not in comp_by_product:
            comp_by_product[pid] = []
        if c.price and float(c.price) > 0:
            comp_by_product[pid].append(float(c.price))

    distribution = {
        "CONSIDER PRICE INCREASE": {"count": 0}, "CONSIDER PRICE DECREASE": {"count": 0},
        "PROTECT MARGIN": {"count": 0}, "MAINTAIN PRICE": {"count": 0}, "MONITOR MARKET": {"count": 0},
    }

    for pid, cat_prod in catalog_map.items():
        stats = prod_financial_map.get(pid)
        rev = float(stats.total_rev or 0) if stats else 0
        units = int(stats.total_units or 0) if stats else 0
        avg_cost = float(stats.avg_cost or 0) if stats else 0
        inventory = int(stats.avg_inv or 0) if stats else 0
        demand_index = float(stats.avg_demand or 100) if stats else 100

        if rev > 0 and units > 0:
            fin = cf(rev, units, avg_cost)
            margin_pct = fin["profit_margin_pct"]
            current_price = float(stats.avg_price or 0)
        else:
            current_price = float(cat_prod.base_price or 0)
            cost_price_val = float(cat_prod.cost_price or 0)
            fin = cf(current_price, 1, cost_price_val)
            margin_pct = fin["profit_margin_pct"]

        comp_prices = comp_by_product.get(pid, [])
        market_avg = sum(comp_prices) / len(comp_prices) if comp_prices else None
        gap_pct = ((current_price - market_avg) / market_avg * 100) if market_avg and current_price > 0 else 0

        comp_movement = "Stable"
        if len(comp_prices) >= 2:
            latest, prev = comp_prices[-1], comp_prices[-2]
            if latest > prev * 1.02: comp_movement = "Increasing"
            elif latest < prev * 0.98: comp_movement = "Decreasing"

        # Fast dictionary lookup instead of ML inference loop
        forecast_trend = batch_trends.get(pid, "Stable")

        from app.services.strategy_service import PricingStrategyEngine
        strategy = PricingStrategyEngine.evaluate_rules(
            current_price=current_price,
            cost_price=cost_price_val,
            margin_pct=margin_pct,
            market_avg=market_avg,
            gap_pct=gap_pct,
            comp_movement=comp_movement,
            inventory=inventory,
            demand_index=demand_index,
            forecast_trend=forecast_trend,
            ml_optimal_price=None
        )
        action = strategy["recommendation"]
        
        if return_raw:
            strategy["product"] = {
                "id": pid,
                "name": cat_prod.product_name,
                "category": cat_prod.category
            }
            raw_strategies.append(strategy)

        if action in distribution:
            distribution[action]["count"] += 1

    total_analyzed = len(catalog_map)
    for k in distribution.keys():
        distribution[k]["pct"] = round((distribution[k]["count"] / total_analyzed * 100), 1) if total_analyzed > 0 else 0
        
    if return_raw:
        return raw_strategies
        
    return distribution


def get_executive_summary(db):
    """
    Aggregates outputs of all existing verified modules into one executive payload.
    No new SQL calculations - all values from:
      get_profitability_analysis(), competitor_service.get_market_intelligence_data(),
      get_strategy_distribution_all_products()
    """
    from app.services.competitor_service import get_market_intelligence_data

    profitability = get_profitability_analysis(db)
    overview = profitability["overview"]
    categories = profitability["categories"]
    products_data = profitability["products"]
    risk = profitability["risk"]
    insights = profitability["insights"]

    market_data = get_market_intelligence_data(db)
    market_position = market_data["market_position"]
    price_movement = market_data["price_movement"]
    movement_summary = market_data["movement_summary"]
    top_opportunities = market_data["top_opportunities"]
    avg_gap_pct = market_data.get("avg_gap_pct")

    strategy_dist = get_strategy_distribution_all_products(db)

    active_products = [p for p in products_data if p["revenue"] > 0]
    active_categories = [c for c in categories if c["revenue"] > 0]

    top_by_gp     = sorted(active_products, key=lambda x: x["gross_profit"], reverse=True)[:5]
    top_by_rev    = sorted(active_products, key=lambda x: x["revenue"],      reverse=True)[:5]
    bottom_margin = sorted(active_products, key=lambda x: x["profit_margin_pct"])[:5]
    top_margin    = sorted(active_products, key=lambda x: x["profit_margin_pct"], reverse=True)[:5]
    top_cats_gp   = sorted(active_categories, key=lambda x: x["gross_profit"], reverse=True)[:5]
    top_cats_rev  = sorted(active_categories, key=lambda x: x["revenue"],      reverse=True)[:5]

    attention_items = []
    total_rev = overview["total_revenue"]; total_gp = overview["gross_profit"]
    avg_margin = overview["avg_margin"]
    high_risk_count = risk.get("High Risk", 0)
    at_risk_only = risk.get("At Risk", 0)
    at_risk_count = high_risk_count + at_risk_only
    neg_profit_count = risk.get("Negative Profit", 0)
    insufficient_count = risk.get("Insufficient Data", 0)
    above_market = market_position.get("expensive", 0)
    below_market = market_position.get("cheaper", 0)
    near_market  = market_position.get("near", 0)
    increase_count = strategy_dist.get("CONSIDER PRICE INCREASE", {}).get("count", 0)
    decrease_count = strategy_dist.get("CONSIDER PRICE DECREASE", {}).get("count", 0)
    protect_count  = strategy_dist.get("PROTECT MARGIN", {}).get("count", 0)
    monitor_count  = strategy_dist.get("MONITOR MARKET", {}).get("count", 0)
    maintain_count = strategy_dist.get("MAINTAIN PRICE", {}).get("count", 0)
    rev_conc = insights.get("revenue_concentration_top_10", 0)
    top_cat  = insights.get("highest_profit_category", "N/A")
    profitability_rate = overview.get("profitability_rate", 0)
    total_analyzed = overview.get("total_analyzed", 0)

    if neg_profit_count > 0:
        attention_items.append({"severity": "Critical", "category": "Negative Profit",
            "title": f"{neg_profit_count} products have negative gross profit",
            "detail": "COGS exceeds revenue — immediate pricing or cost review required.",
            "link": "/analytics", "link_label": "Profitability Analytics"})
    if high_risk_count > 0:
        attention_items.append({"severity": "Critical", "category": "Margin Risk",
            "title": f"{high_risk_count} products are HIGH RISK (margin <10%)",
            "detail": "Margins critically below threshold.",
            "link": "/analytics", "link_label": "Profitability Analytics"})
    if at_risk_only > 0:
        attention_items.append({"severity": "High", "category": "Margin Risk",
            "title": f"{at_risk_only} products are AT RISK (margin 10-15%)",
            "detail": "Below healthy 15% threshold - vulnerable to cost increases.",
            "link": "/analytics", "link_label": "Profitability Analytics"})
    if above_market > 0:
        attention_items.append({"severity": "High", "category": "Market Pricing",
            "title": f"{above_market} products priced >3% above market",
            "detail": "Risk of losing market share to competitors.",
            "link": "/competitors", "link_label": "Competitor Analysis"})
    if increase_count > 0:
        attention_items.append({"severity": "Opportunity", "category": "Price Increase",
            "title": f"{increase_count} products eligible for price increase",
            "detail": "Low inventory + high demand or favorable competitive position.",
            "link": "/revenue-optimization", "link_label": "Pricing Strategy"})
    if decrease_count > 0:
        attention_items.append({"severity": "Opportunity", "category": "Price Decrease",
            "title": f"{decrease_count} products recommended for price decrease",
            "detail": "High inventory + low demand or price above market.",
            "link": "/revenue-optimization", "link_label": "Pricing Strategy"})
    if below_market > 0 and protect_count > 0:
        attention_items.append({"severity": "Medium", "category": "Below Market",
            "title": f"{below_market} products priced >3% below market",
            "detail": f"{protect_count} also flagged for margin protection.",
            "link": "/competitors", "link_label": "Competitor Analysis"})
    if rev_conc and rev_conc > 70:
        attention_items.append({"severity": "Medium", "category": "Revenue Concentration",
            "title": f"Top 10 products account for {rev_conc:.1f}% of total revenue",
            "detail": "High concentration increases business risk.",
            "link": "/analytics", "link_label": "Profitability Analytics"})
    if insufficient_count > 0:
        attention_items.append({"severity": "Low", "category": "Data Coverage",
            "title": f"{insufficient_count} products have insufficient financial history",
            "detail": "Cannot be strategically evaluated without sales history.",
            "link": "/revenue-optimization", "link_label": "Pricing Strategy"})

    margin_stmt = (
        f"{at_risk_count} products are below the healthy margin threshold (<15%)"
        if at_risk_count > 0 else "margin health is within acceptable range"
    )
    opp_stmt = (
        f"{increase_count} price-increase and {decrease_count} price-decrease opportunities identified"
        if (increase_count + decrease_count) > 0 else "no pricing adjustment opportunities identified"
    )
    exec_summary = (
        f"PricePilot is monitoring {total_analyzed} products across the catalog. "
        f"Total revenue: INR {total_rev:,.0f} | Gross profit: INR {total_gp:,.0f} | Avg margin: {avg_margin:.1f}%. "
        f"Of products with financial history, {profitability_rate:.0f}% are profitable. "
        f"{margin_stmt.capitalize()}. "
        f"Market position: {below_market} products below market, {near_market} near market, {above_market} above market. "
        f"{opp_stmt.capitalize()}. "
        f"Category '{top_cat}' delivers the highest gross profit."
    )

    return {
        "overview": overview, "risk": risk, "insights": insights,
        "active_categories": active_categories,
        "top_performers": {
            "by_gross_profit": top_by_gp, "by_revenue": top_by_rev,
            "lowest_margin": bottom_margin, "highest_margin": top_margin,
            "top_categories_gp": top_cats_gp, "top_categories_rev": top_cats_rev,
        },
        "market": {
            "position": market_position, "price_movement": price_movement,
            "movement_summary": movement_summary, "top_opportunities": top_opportunities,
            "avg_gap_pct": avg_gap_pct,
        },
        "strategy_distribution": strategy_dist,
        "management_attention": attention_items,
        "executive_summary_text": exec_summary,
    }
