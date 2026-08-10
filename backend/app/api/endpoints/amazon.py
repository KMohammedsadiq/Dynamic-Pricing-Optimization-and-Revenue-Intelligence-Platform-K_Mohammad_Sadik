import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

RAPID_API_KEY = "e49db6e9e2mshec7307f807db8f8p10deb8jsn5ec4e09da89b"
RAPID_API_HOST = "real-time-amazon-data.p.rapidapi.com"
BASE_URL = f"https://{RAPID_API_HOST}"

class AmazonTestRequest(BaseModel):
    endpoint_type: str  # "search" or "details"
    query_params: Dict[str, Any]

@router.post("/test")
def test_amazon_api(request: AmazonTestRequest):
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
