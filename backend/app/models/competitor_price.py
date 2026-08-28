from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.session import Base

class CompetitorPriceHistory(Base):
    __tablename__ = "competitor_price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, index=True, nullable=False) # e.g. ACC001 (from dataset)
    competitor_name = Column(String, index=True, nullable=False) # "Amazon" or "Flipkart"
    competitor_product_id = Column(String, nullable=True) # ASIN or FSN (optional)
    competitor_product_name = Column(String, nullable=True)
    competitor_url = Column(String, nullable=True)
    match_confidence = Column(Integer, nullable=True) # 0-100%
    is_available = Column(Boolean, default=True)
    data_source = Column(String, default="EXISTING_VERIFIED", nullable=True)
    
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR", nullable=False)
    
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    last_checked_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
