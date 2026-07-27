from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from app.core.security import verify_access_token

# OAuth2PasswordBearer is a FastAPI utility that looks for the 
# "Authorization: Bearer <token>" header in the HTTP request.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user_token(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    """
    Extracts and verifies the JWT token from the request.
    Returns the decoded token payload.
    Throws a 401 Unauthorized error if the token is missing or invalid.
    """
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def require_admin(token_payload: Annotated[dict, Depends(get_current_user_token)]):
    """
    Dependency that ensures the current user has the 'Admin' role.
    Throws 403 Forbidden if they do not.
    """
    role = token_payload.get("role")
    if role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action. Admin role required."
        )
    return token_payload

def require_pricing_manager(token_payload: Annotated[dict, Depends(get_current_user_token)]):
    """
    Dependency that ensures the current user has the 'Pricing Manager' role.
    """
    role = token_payload.get("role")
    # In enterprise apps, higher roles (like Admin) usually inherit permissions.
    # For simplicity, we allow either Pricing Manager or Admin.
    if role not in ["Pricing Manager", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pricing Manager role required."
        )
    return token_payload

def require_business_analyst(token_payload: Annotated[dict, Depends(get_current_user_token)]):
    """
    Dependency that ensures the current user has the 'Business Analyst' role.
    """
    role = token_payload.get("role")
    if role not in ["Business Analyst", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business Analyst role required."
        )
    return token_payload
