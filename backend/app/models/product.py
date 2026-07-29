from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Product Info (Persists across both datasets)
    product_id = Column(String, index=True, nullable=False)
    
    # --- OLD DATASET COLUMNS (Temporarily Retained for Backward Compatibility) ---
    # TODO: Deprecate and remove these in a future cleanup migration
    product_category_name = Column(String, index=True, nullable=True)
    month_year = Column(String(50), nullable=True)
    qty = Column(Integer, default=0, nullable=True)
    volume = Column(Integer, nullable=True)
    customers = Column(Integer, nullable=True)
    total_price = Column(Numeric(10, 2), nullable=True)
    freight_price = Column(Numeric(10, 2), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True)  # Changed from nullable=False
    comp_1 = Column(Numeric(10, 2), nullable=True)
    comp_2 = Column(Numeric(10, 2), nullable=True)
    comp_3 = Column(Numeric(10, 2), nullable=True)
    lag_price = Column(Numeric(10, 2), nullable=True)
    product_score = Column(Numeric(3, 2), nullable=True)
    weekday = Column(Integer, nullable=True)
    weekend = Column(Integer, nullable=True)
    holiday = Column(Integer, nullable=True)
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    s = Column(Numeric(10, 2), nullable=True)

    # --- NEW DATASET COLUMNS (retail_pricing_demand_100k) ---
    date = Column(DateTime, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    brand = Column(String, index=True, nullable=True)
    region = Column(String, index=True, nullable=True)
    channel = Column(String, index=True, nullable=True)
    season = Column(String, index=True, nullable=True)
    
    # New Pricing & Promotions
    base_price = Column(Numeric(10, 2), nullable=True)
    current_price = Column(Numeric(10, 2), nullable=True)
    price_change_pct = Column(Numeric(10, 2), nullable=True)
    discount_pct = Column(Numeric(10, 2), nullable=True)
    promotion_type = Column(String, nullable=True)
    
    # New Demand & Inventory
    units_sold = Column(Integer, default=0, nullable=True)
    revenue = Column(Numeric(10, 2), nullable=True)
    inventory_level = Column(Integer, nullable=True)
    stockout_flag = Column(Integer, nullable=True)
    demand_index = Column(Numeric(10, 2), nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
