from sqlalchemy import Column, Integer, String, Boolean, Numeric
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.session import Base

class ProductCatalog(Base):
    __tablename__ = "product_catalog"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Product Info
    product_id = Column(String, unique=True, index=True, nullable=False) # SKU
    product_name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=True)
    brand = Column(String, index=True, nullable=True)
    description = Column(String, nullable=True)
    
    # Pricing & Inventory
    base_price = Column(Numeric(10, 2), nullable=False)
    current_price = Column(Numeric(10, 2), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)
    initial_inventory = Column(Integer, default=0, nullable=False)
    
    # New Business Attributes (retail_pricing_demand_final)
    product_model = Column(String, nullable=True)
    launch_year = Column(Integer, nullable=True)
    days_since_launch = Column(Integer, nullable=True)
    product_lifecycle = Column(String, nullable=True)
    competitor_price = Column(Numeric(10, 2), nullable=True)
    average_rating = Column(Numeric(3, 2), nullable=True)
    review_count = Column(Integer, nullable=True)
    historical_sales = Column(Integer, nullable=True)
    profit_margin = Column(Numeric(10, 2), nullable=True)
    supplier_name = Column(String, nullable=True)
    
    # ── Structured Identity Attributes ──
    variant = Column(String, nullable=True)
    gtin = Column(String, nullable=True)
    upc = Column(String, nullable=True)
    ean = Column(String, nullable=True)
    
    # Electronics
    cpu = Column(String, nullable=True)
    ram = Column(String, nullable=True)
    storage = Column(String, nullable=True)
    
    # Apparel / Shoes
    gender = Column(String, nullable=True)
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)
    style = Column(String, nullable=True)
    
    # Books
    author = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    edition = Column(String, nullable=True)
    
    # Beauty / Groceries / Furniture / Accessories
    volume = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    pack_size = Column(String, nullable=True)
    dimensions = Column(String, nullable=True)
    material = Column(String, nullable=True)
    
    # Marketplace Integration Metadata
    marketplace_search_name = Column(String, nullable=True)
    marketplace_ready = Column(Boolean, default=False)
    
    # State Management
    status = Column(String, default="Active", index=True)
    is_deleted = Column(Boolean, default=False, index=True)
    catalog_source = Column(String, default="ORIGINAL", index=True)
    has_historical_demand = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
