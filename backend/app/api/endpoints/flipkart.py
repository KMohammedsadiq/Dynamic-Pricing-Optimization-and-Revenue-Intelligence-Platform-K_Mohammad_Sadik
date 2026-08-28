import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.core.config import settings

router = APIRouter()

RAPID_API_KEY = settings.RAPID_API_KEY
RAPID_API_HOST = settings.FLIPKART_API_HOST
BASE_URL = f"https://{RAPID_API_HOST}"

class FlipkartTestRequest(BaseModel):
    endpoint_type: str  # e.g., "category-products-list"
    query_params: Dict[str, Any]

@router.post("/test")
def test_flipkart_api(request: FlipkartTestRequest):
    """
    Secure proxy to call RapidAPI Flipkart Data without exposing the API key to the frontend.
    """
    if request.endpoint_type == "category-products-list":
        url = f"{BASE_URL}/backend/rapidapi/category-products-list"
    elif request.endpoint_type == "product-details":
        url = f"{BASE_URL}/backend/rapidapi/product-details"
    else:
        raise HTTPException(status_code=400, detail="Invalid endpoint type.")
        
    headers = {
        "x-rapidapi-key": RAPID_API_KEY,
        "x-rapidapi-host": RAPID_API_HOST
    }
    
    try:
        response = requests.get(url, headers=headers, params=request.query_params)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RapidAPI request failed: {str(e)}")
