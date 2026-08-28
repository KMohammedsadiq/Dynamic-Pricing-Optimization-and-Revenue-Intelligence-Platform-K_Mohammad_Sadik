from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from app.db.session import get_db
from app.api.deps import get_current_user_token
from app.models.competitor_price import CompetitorPriceHistory
from app.models.product_catalog import ProductCatalog
from app.services.competitor_sync_service import CompetitorSyncService
from app.services.competitor_service import get_market_intelligence_data
from sqlalchemy.exc import OperationalError

router = APIRouter()

@router.get("/summary")
def get_competitors_summary(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_token)):
    """
    Fetch all products with their latest Amazon and Flipkart prices.
    Efficiently queries both tables and builds a tailored response to avoid N+1 queries.
    """
    products = db.query(ProductCatalog).all()
    history = db.query(CompetitorPriceHistory).order_by(desc(CompetitorPriceHistory.scraped_at)).all()
    
    latest_amz = {}
    latest_fk = {}
    
    for h in history:
        if h.competitor_name == "Amazon" and h.product_id not in latest_amz:
            latest_amz[h.product_id] = h
        elif h.competitor_name == "Flipkart" and h.product_id not in latest_fk:
            latest_fk[h.product_id] = h
            
    result = []
    for p in products:
        amz = latest_amz.get(p.product_id)
        fk = latest_fk.get(p.product_id)
        
        result.append({
            "product_id": p.product_id,
            "product_name": p.product_name,
            "category": p.category,
            "base_price": float(p.base_price) if p.base_price else None,
            "amazon_price": float(amz.price) if amz else None,
            "amazon_data_source": amz.data_source if amz else None,
            "amazon_verified_at": amz.scraped_at.isoformat() if amz and amz.scraped_at else None,
            "flipkart_price": float(fk.price) if fk else None,
            "flipkart_data_source": fk.data_source if fk else None,
            "flipkart_verified_at": fk.scraped_at.isoformat() if fk and fk.scraped_at else None,
        })
        
    return {"data": result}


@router.get("/market-intelligence")
def get_market_intelligence(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_token)):
    """
    Compute full market intelligence aggregations from existing DB data only.
    Delegates to competitor_service.get_market_intelligence_data() — the single
    source of truth shared with the Executive BI module.
    """
    return get_market_intelligence_data(db)


@router.get("/history/{product_id}")
def get_competitor_history(product_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_token)):
    """
    Fetch the time-series competitor price history for a given product_id.
    Also returns the latest cached price per competitor for cache-first display.
    """
    history = db.query(CompetitorPriceHistory)\
        .filter(CompetitorPriceHistory.product_id == product_id)\
        .order_by(CompetitorPriceHistory.scraped_at.asc())\
        .all()
        
    # Group by competitor for frontend chart
    amazon_data = []
    flipkart_data = []
    latest = {"Amazon": None, "Flipkart": None}
    
    for entry in history:
        point = {
            "date": entry.scraped_at.isoformat(),
            "price": float(entry.price),
            "url": entry.competitor_url
        }
        if entry.competitor_name == "Amazon":
            amazon_data.append(point)
            latest["Amazon"] = entry
        elif entry.competitor_name == "Flipkart":
            flipkart_data.append(point)
            latest["Flipkart"] = entry

    def _serialize_latest(record):
        if not record:
            return {"status": "no_data", "message": "No data yet. Click Sync to fetch live prices."}
        return {
            "status": "cached",
            "message": "Last successfully fetched price.",
            "price": float(record.price),
            "url": record.competitor_url,
            "title": record.competitor_product_name,
            "confidence": record.match_confidence,
            "scraped_at": record.scraped_at.isoformat() if record.scraped_at else None,
            "last_checked_at": record.last_checked_at.isoformat() if record.last_checked_at else None,
            "data_source": record.data_source,
        }

    return {
        "product_id": product_id,
        "history": {
            "Amazon": amazon_data,
            "Flipkart": flipkart_data
        },
        "latest_prices": {
            "Amazon": _serialize_latest(latest["Amazon"]),
            "Flipkart": _serialize_latest(latest["Flipkart"]),
        }
    }

@router.post("/sync/{product_id}")
def sync_competitor_prices(product_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_token)):
    """
    Triggers a live sync from RapidAPI (Amazon & Flipkart) for this product.
    """
    try:
        product = db.query(ProductCatalog).filter(ProductCatalog.product_id == product_id).with_for_update(nowait=True).first()
    except OperationalError:
        db.rollback()
        raise HTTPException(status_code=429, detail="A sync for this product is already in progress. Please wait.")
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in catalog.")
        
    service = CompetitorSyncService(db)
    
    try:
        results = service.sync_product(
            product_id=product.product_id,
            product_name=product.product_name,
            brand=product.brand or "",
            product_model=product.product_model or "",
            force=True
        )
        return {
            "message": "Sync completed",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
