from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Request Schema: What the client sends to us
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=50, description="The user's full name")
    email: EmailStr = Field(..., description="A valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")

# Response Schema: What we return back to the client
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Tells Pydantic to read data even if it is not a dict (like a SQLAlchemy model)

# Login Schema: Specific to login requests
class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="The registered email address")
    password: str = Field(..., description="The user's raw password")

# Token Response Schema: What is returned on successful login
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
