from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PricePilot AI API",
    description="Backend API for PricePilot AI Dynamic Pricing Optimization & Revenue Intelligence System",
    version="1.0.0"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to PricePilot AI API"}
