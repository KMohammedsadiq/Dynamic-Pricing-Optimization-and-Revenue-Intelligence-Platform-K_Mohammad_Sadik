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
