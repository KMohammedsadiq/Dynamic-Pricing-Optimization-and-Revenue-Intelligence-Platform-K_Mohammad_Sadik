from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core fields
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Security (Never store plain-text passwords!)
    password_hash = Column(String, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Foreign Key establishing the Many-to-One relationship to Role
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to Role
    role = relationship("Role", back_populates="users")
