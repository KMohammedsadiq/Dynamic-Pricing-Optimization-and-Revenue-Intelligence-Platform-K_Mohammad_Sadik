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

@app.on_event("startup")
def create_default_admin():
    from app.db.session import SessionLocal, engine, Base
    import app.models  # This imports all models so Base knows about them
    from app.crud.crud_user import get_user_by_email
    from app.models.role import Role
    from app.models.user import User
    from app.core.security import get_password_hash

    # Create all tables in the database if they don't exist yet!
    print("Creating database tables if they don't exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Create Admin role if not exists
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            
        admin_user = get_user_by_email(db, email="admin@pricepilot.com")
        if not admin_user:
            admin_user = User(
                full_name="System Administrator",
                email="admin@pricepilot.com",
                password_hash=get_password_hash("admin"),
                role_id=admin_role.id
            )
            db.add(admin_user)
            db.commit()
            print("Default admin created: admin@pricepilot.com / admin")
    except Exception as e:
        print(f"Failed to create default admin: {e}")
    finally:
        db.close()

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

@app.post("/admin/fix-product-catalog")
async def fix_product_catalog(db: Session = Depends(get_db)):
    """
    One-time admin fix: copies real product_name and cost_price from the
    historical 'products' table into 'product_catalog' where data is missing.
    Safe to call multiple times (only updates rows that have wrong/null data).
    """
    try:
        # Step 1: Update product_name where it equals product_id (was auto-set incorrectly)
        r1 = db.execute(text("""
            UPDATE product_catalog pc
            SET product_name = sub.product_name
            FROM (
                SELECT DISTINCT ON (product_id) product_id, product_name
                FROM products
                WHERE product_name IS NOT NULL
                  AND product_name != ''
                  AND product_name != product_id
                ORDER BY product_id, product_name
            ) sub
            WHERE pc.product_id = sub.product_id
              AND (pc.product_name IS NULL
                   OR pc.product_name = ''
                   OR pc.product_name = pc.product_id)
        """))
        names_updated = r1.rowcount

        # Step 2: Update cost_price where it is null or 0
        r2 = db.execute(text("""
            UPDATE product_catalog pc
            SET cost_price = sub.avg_cost
            FROM (
                SELECT product_id, AVG(cost_price) AS avg_cost
                FROM products
                WHERE cost_price IS NOT NULL AND cost_price > 0
                GROUP BY product_id
            ) sub
            WHERE pc.product_id = sub.product_id
              AND (pc.cost_price IS NULL OR pc.cost_price = 0)
        """))
        costs_updated = r2.rowcount

        # Step 3: Update current_price where null or 0
        r3 = db.execute(text("""
            UPDATE product_catalog pc
            SET current_price = sub.avg_price
            FROM (
                SELECT product_id, AVG(current_price) AS avg_price
                FROM products
                WHERE current_price > 0
                GROUP BY product_id
            ) sub
            WHERE pc.product_id = sub.product_id
              AND (pc.current_price IS NULL OR pc.current_price = 0)
        """))
        prices_updated = r3.rowcount

        # Step 4: Update base_price where null or 0
        r4 = db.execute(text("""
            UPDATE product_catalog pc
            SET base_price = sub.avg_base
            FROM (
                SELECT product_id, AVG(base_price) AS avg_base
                FROM products
                WHERE base_price > 0
                GROUP BY product_id
            ) sub
            WHERE pc.product_id = sub.product_id
              AND (pc.base_price IS NULL OR pc.base_price = 0)
        """))
        base_updated = r4.rowcount

        db.commit()

        return {
            "status": "success",
            "names_updated": names_updated,
            "cost_prices_updated": costs_updated,
            "current_prices_updated": prices_updated,
            "base_prices_updated": base_updated,
            "message": "product_catalog has been fixed successfully"
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


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
from app.api.endpoints import auth, dashboard, products, users, analytics, predictions, historical, amazon, flipkart, competitors

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

app.include_router(
    competitors.router,
    prefix="/api/v1/competitors",
    tags=["Competitors"]
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

app.include_router(
    flipkart.router,
    prefix="/api/v1/flipkart",
    tags=["Flipkart"]
)
