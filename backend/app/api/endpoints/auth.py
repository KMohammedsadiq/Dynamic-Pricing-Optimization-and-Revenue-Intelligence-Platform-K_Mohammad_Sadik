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

from app.schemas.user import UserLogin, TokenResponse
from app.core.security import verify_password, create_access_token

@router.post("/login", response_model=TokenResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token along with their profile.
    """
    # 1. Search the database for the provided email
    db_user = get_user_by_email(db, email=user_credentials.email)
    
    # 2. Handle User Not Found or Incorrect Password
    if not db_user or not verify_password(user_credentials.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # 3. Check if the account is active
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
        
    # 4. Generate the JWT Access Token
    # We include user_id and role directly inside the token to avoid database lookups on every request!
    role_name = db_user.role.name if db_user.role else "User"
    access_token = create_access_token(data={
        "sub": db_user.email,
        "user_id": db_user.id,
        "role": role_name
    })
        
    # 5. Return the TokenResponse schema
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

from pydantic import BaseModel
import urllib.request
import json
from app.models.role import Role
from app.core.security import get_password_hash
import uuid

class GoogleLogin(BaseModel):
    access_token: str

@router.post("/google", response_model=TokenResponse)
def google_login(google_credentials: GoogleLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user using a Google OAuth Access Token.
    If the user doesn't exist, create an account with 'Viewer' role.
    """
    access_token = google_credentials.access_token
    
    # 1. Fetch user info from Google
    try:
        req = urllib.request.Request("https://www.googleapis.com/oauth2/v3/userinfo")
        req.add_header("Authorization", f"Bearer {access_token}")
        with urllib.request.urlopen(req) as response:
            google_data = json.loads(response.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
        
    email = google_data.get("email")
    name = google_data.get("name")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have an email"
        )
        
    # 2. Check if user exists
    db_user = get_user_by_email(db, email=email)
    
    # 3. Create user if they don't exist
    if not db_user:
        viewer_role = db.query(Role).filter(Role.name == "Viewer").first()
        if not viewer_role:
            # Fallback if Viewer role doesn't exist for some reason
            viewer_role = Role(name="Viewer")
            db.add(viewer_role)
            db.commit()
            db.refresh(viewer_role)
            
        from app.models.user import User
        # Create user with a dummy secure password
        random_password = get_password_hash(str(uuid.uuid4()))
        db_user = User(
            full_name=name,
            email=email,
            password_hash=random_password,
            role_id=viewer_role.id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
    # 4. Check if account is active
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
        
    # 5. Generate JWT Access Token
    role_name = db_user.role.name if db_user.role else "User"
    jwt_token = create_access_token(data={
        "sub": db_user.email,
        "user_id": db_user.id,
        "role": role_name
    })
    
    # 6. Return standard TokenResponse
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": db_user
    }
