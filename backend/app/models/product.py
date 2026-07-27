from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Product Info
    product_id = Column(String, unique=True, index=True, nullable=False)
    category_name = Column(String, index=True)
    
    # Pricing Information
    unit_price = Column(Numeric(10, 2), nullable=False)
    freight_price = Column(Numeric(10, 2))
    
    # Competitor Pricing
    comp_1 = Column(Numeric(10, 2))
    comp_2 = Column(Numeric(10, 2))
    comp_3 = Column(Numeric(10, 2))
    
    # Demand & Rating
    qty_orders = Column(Integer, default=0)
    product_score = Column(Numeric(3, 2))
    
    # Time & Seasonality (Flags for ML)
    weekend = Column(Boolean, default=False)
    holiday = Column(Boolean, default=False)
    season = Column(String(50))
    month = Column(Integer)
    year = Column(Integer)
    
    # Relationships & Audit
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to User
    uploader = relationship("User", backref="uploaded_products")
