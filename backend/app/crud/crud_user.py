from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    """
    Query the database to find a user by their email.
    Returns the User object if found, or None if it doesn't exist.
    """
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    """
    Takes the validated Pydantic UserCreate schema, hashes the password,
    and saves the new user into the PostgreSQL database.
    """
    # 1. Hash the plain-text password
    hashed_password = get_password_hash(user.password)
    
    # 2. Create the SQLAlchemy model instance
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password
    )
    
    # 3. Add to the session and commit (save) to the database
    db.add(db_user)
    db.commit()
    
    # 4. Refresh to grab the newly auto-generated ID and created_at fields
    db.refresh(db_user)
    
    return db_user
