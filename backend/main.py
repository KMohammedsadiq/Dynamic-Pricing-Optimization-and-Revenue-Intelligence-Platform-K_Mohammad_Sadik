from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

# Initialize the FastAPI application instance
app = FastAPI(
    title="Dynamic Pricing Optimization and Revenue Intelligence System ",
    description="Backend API for Dynamic Pricing Optimization and Revenue Intelligence System",
    version="1.0.0"
)

# Set up CORS (Cross-Origin Resource Sharing)
# This allows our React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production (e.g., ["http://localhost:3000"])
    allow_credentials=True,
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
