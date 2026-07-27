from passlib.context import CryptContext

# 1. Initialize the CryptContext
# We configure Passlib to use the bcrypt algorithm.
# deprecated="auto" ensures that if we ever upgrade to a newer hashing algorithm 
# in the future, Passlib will automatically re-hash old passwords upon login.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from typing import Optional

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add the expiration time to the payload under the standard 'exp' key
    to_encode.update({"exp": expire})
    
    # Sign the JWT using the secret key and the algorithm
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> dict | None:
    """
    Verify a JWT access token and return its decoded payload.
    """
    try:
        decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_data
    except jwt.PyJWTError:
        # Returns None if the token is expired or invalid
        return None

def get_password_hash(password: str) -> str:
    """
    Takes a raw password (e.g., during registration) and generates a 
    cryptographically secure, salted bcrypt hash to be stored in the database.
    """
    return pwd_context.hash(password)
