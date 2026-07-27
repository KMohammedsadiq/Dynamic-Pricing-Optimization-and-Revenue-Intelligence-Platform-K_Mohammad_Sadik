from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.crud.crud_user import get_user_by_email, create_user
from app.db.session import get_db

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user in the system.
    """
    # 1. Check if the email already exists in PostgreSQL
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        # If it exists, instantly abort and return a 400 Bad Request error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. If the email is unique, proceed to hash the password and save the user
    new_user = create_user(db=db, user=user)
    
    # 3. Return the newly created user (FastAPI automatically strips out the password_hash 
    # because our UserResponse schema does not include it)
    return new_user

from app.schemas.user import UserLogin
from app.core.security import verify_password

@router.post("/login", response_model=UserResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return their profile information.
    """
    # 1. Search the database for the provided email
    db_user = get_user_by_email(db, email=user_credentials.email)
    
    # 2. Handle User Not Found or Incorrect Password
    # Security Note: We return the exact same generic error for both scenarios.
    # If we said "User not found", hackers could use our API to guess valid emails.
    if not db_user or not verify_password(user_credentials.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # 3. Check if the account is active (not banned/soft-deleted)
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
        
    # 4. Return the authenticated user's information
    return db_user
