from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

# Initialize the FastAPI application instance
app = FastAPI(
    title="Dynamic Pricing Optimization and Revenue Intelligence System ",
    description="Backend API for Dynamic Pricing Optimization and Revenue Intelligence System",
    version="1.0.0",
    debug=True
)

# Set up CORS (Cross-Origin Resource Sharing)
# This allows our React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, IPs, and port numbers
    allow_credentials=False, # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define our first API endpoint (Routing)
@app.get("/")
async def read_root():
    """
    Health check endpoint to verify the API is running.
    """
    return {"message": "Welcome to Dynamic Pricing Optimization and Revenue Intelligence System API", "status": "healthy", "version": "1.0.0"}

@app.get("/test-db")
async def test_db_connection(db: Session = Depends(get_db)):
    """
    Endpoint to test the PostgreSQL database connection.
    """
    try:
        # Execute a simple raw SQL query to test connectivity
        result = db.execute(text("SELECT 1")).fetchone()
        if result:
            return {"status": "success", "message": "Successfully connected to PostgreSQL database!"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}

# Import and include the Authentication router
from app.api.endpoints import auth, dashboard, products, users, analytics, predictions, historical, amazon

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

app.include_router(
    dashboard.router,
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    products.router,
    prefix="/api/v1/products",
    tags=["Products"]
)

app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["Users"]
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)

app.include_router(
    predictions.router,
    prefix="/api/v1/predictions",
    tags=["Machine Learning"]
)

app.include_router(
    historical.router,
    prefix="/api/v1",
    tags=["Historical Analysis"]
)

app.include_router(
    amazon.router,
    prefix="/api/v1/amazon",
    tags=["Amazon"]
)
