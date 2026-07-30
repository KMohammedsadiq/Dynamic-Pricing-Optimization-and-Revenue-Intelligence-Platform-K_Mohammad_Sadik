from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.role import Role
from app.api.deps import require_admin, get_current_user_token # require_admin checks for Admin role

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_name: str

class RoleUpdateRequest(BaseModel):
    role_name: str

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(require_admin) # Only Admins can view users
):
    """
    Retrieve all registered users and their roles.
    Accessible only to the Admin.
    """
    users = db.query(User).all()
    
    result = []
    for user in users:
        role = db.query(Role).filter(Role.id == user.role_id).first()
        result.append(UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role_name=role.name if role else "Unknown"
        ))
        
    return result

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    db: Session = Depends(get_db),
    token_payload: dict = Depends(require_admin) # Only Admins can change roles
):
    """
    Update a specific user's role.
    """
    # Find the target role
    target_role = db.query(Role).filter(Role.name == request.role_name).first()
    if not target_role:
        raise HTTPException(status_code=400, detail="Invalid role name")
        
    # Find the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent Admin from demoting themselves accidentally
    if user.email == "mohammedsadiq4850@gmail.com" and request.role_name != "Admin":
        raise HTTPException(status_code=403, detail="Cannot change the role of the Master Admin")
        
    # Update role
    user.role_id = target_role.id
    db.commit()
    
    return {"message": f"User {user.email} updated to {request.role_name}"}
