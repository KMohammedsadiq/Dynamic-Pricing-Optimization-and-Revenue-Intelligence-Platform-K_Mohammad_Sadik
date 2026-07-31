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
    cost_price = Column(Numeric(10, 2), nullable=True)
    initial_inventory = Column(Integer, default=0, nullable=False)
    
    # State Management
    status = Column(String, default="Active", index=True)
    is_deleted = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
