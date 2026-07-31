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
    results = db.query(
        Product.product_id,
        func.max(Product.category).label("category"),
        func.sum(Product.revenue).label("total_revenue"),
        func.sum(Product.units_sold).label("total_units"),
        func.avg(Product.current_price).label("avg_price"),
        func.avg(Product.discount_pct).label("avg_discount"),
        func.avg(Product.inventory_level).label("avg_inventory")
    ).filter(Product.product_id.isnot(None))\
     .group_by(Product.product_id)\
     .order_by(desc("total_revenue"))\
     .limit(100)\
     .all()

    data = []
    for r in results:
        rev = float(r.total_revenue or 0)
        discount = float(r.avg_discount or 0)
        
        status = "Healthy"
        recommendation = "Maintain Strategy"
        
        if discount > 30:
            status = "At Risk"
            recommendation = "Review Discount Depth"
        elif rev < 500:
            status = "Low Volume"
            recommendation = "Bundle Product"

        data.append({
            "product_id": r.product_id,
            "revenue": rev,
            "avg_price": float(r.avg_price or 0),
            "discount": discount,
            "units_sold": int(r.total_units or 0),
            "inventory": int(r.avg_inventory or 0),
            "margin": "Requires Cost Data",
            "status": status,
            "recommendation": recommendation
        })
    return data

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
