from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Role(Base):
    __tablename__ = "roles"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core fields
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Audit timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to User
    # 'users' matches the attribute name on the User model
    users = relationship("User", back_populates="role")
