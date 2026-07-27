from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Product Info
    product_id = Column(String, unique=True, index=True, nullable=False)
    product_category_name = Column(String, index=True)
    month_year = Column(String(50))
    
    # Demand & Volume
    qty = Column(Integer, default=0)
    volume = Column(Integer)
    customers = Column(Integer)
    
    # Pricing Information
    total_price = Column(Numeric(10, 2))
    freight_price = Column(Numeric(10, 2))
    unit_price = Column(Numeric(10, 2), nullable=False)
    
    # Competitor Pricing
    comp_1 = Column(Numeric(10, 2))
    comp_2 = Column(Numeric(10, 2))
    comp_3 = Column(Numeric(10, 2))
    lag_price = Column(Numeric(10, 2))
    
    # Ratings
    product_score = Column(Numeric(3, 2))
    
    # Time & Seasonality
    weekday = Column(Integer)
    weekend = Column(Integer)
    holiday = Column(Integer)
    month = Column(Integer)
    year = Column(Integer)
    s = Column(Numeric(10, 2))  # The dataset has 's' which seems to be a seasonality index
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
