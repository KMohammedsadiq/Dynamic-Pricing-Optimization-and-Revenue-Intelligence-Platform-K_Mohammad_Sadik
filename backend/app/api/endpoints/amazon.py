import requests
from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user_token
from pydantic import BaseModel
from typing import Dict, Any

from app.core.config import settings

router = APIRouter()

RAPID_API_KEY = settings.RAPID_API_KEY
RAPID_API_HOST = settings.AMAZON_API_HOST
BASE_URL = f"https://{RAPID_API_HOST}"

class AmazonTestRequest(BaseModel):
    endpoint_type: str  # "search" or "details"
    query_params: Dict[str, Any]

@router.post("/test")
def test_amazon_api(request: AmazonTestRequest, current_user: dict = Depends(get_current_user_token)):
    """
    Secure proxy to call RapidAPI Amazon Data without exposing the API key to the frontend.
    """
    if request.endpoint_type == "search":
        url = f"{BASE_URL}/search"
    elif request.endpoint_type == "details":
        url = f"{BASE_URL}/product-details"
    else:
        raise HTTPException(status_code=400, detail="Invalid endpoint type. Use 'search' or 'details'.")
        
    headers = {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": RAPID_API_HOST
    }
    
    try:
        response = requests.get(url, headers=headers, params=request.query_params)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RapidAPI request failed: {str(e)}")
