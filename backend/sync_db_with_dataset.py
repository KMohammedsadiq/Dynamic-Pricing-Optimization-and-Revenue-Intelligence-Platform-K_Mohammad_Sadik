import os
import sys
import pandas as pd
from sqlalchemy.orm import Session

# Add backend directory to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from app.db.session import SessionLocal, Base, engine
from app.models.product_catalog import ProductCatalog

DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "retail_price_optimization_dataset_cleaned_expanded.csv")

def sync_db():
    print(f"Loading dataset from {DATA_PATH}...")
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATA_PATH}")
        sys.exit(1)

    print(f"Loaded {len(df)} rows. Finding latest record for each product...")
    
    # Sort by date descending, then drop duplicates by product_id to keep only the latest record
    # If date is not a string, convert it first (assuming YYYY-MM-DD or similar)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date', ascending=False)
        
    latest_products = df.drop_duplicates(subset=['product_id'], keep='first')
    
    print(f"Found {len(latest_products)} unique products. Upserting to database...")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        upsert_count = 0
        insert_count = 0
        
        for _, row in latest_products.iterrows():
            product_id = str(row.get('product_id'))
            
            # Find existing product
            db_product = db.query(ProductCatalog).filter(ProductCatalog.product_id == product_id).first()
            
            is_new = False
            if not db_product:
                db_product = ProductCatalog(product_id=product_id)
                db.add(db_product)
                insert_count += 1
                is_new = True
            else:
                upsert_count += 1
                
            # Update fields
            db_product.product_name = str(row.get('product_name', 'Unknown Product'))
            db_product.category = str(row.get('category', 'General'))
            db_product.brand = str(row.get('brand', 'Unknown'))
            db_product.base_price = float(row.get('base_price', 0))
            db_product.current_price = float(row.get('current_price', 0))
            db_product.cost_price = float(row.get('cost_price', 0))
            db_product.initial_inventory = int(row.get('inventory_level', 100))
            
            db_product.product_model = str(row.get('product_model', '')) if pd.notna(row.get('product_model')) else None
            db_product.launch_year = int(row.get('launch_year', 2023)) if pd.notna(row.get('launch_year')) else None
            db_product.days_since_launch = int(row.get('days_since_launch', 0)) if pd.notna(row.get('days_since_launch')) else None
            db_product.product_lifecycle = str(row.get('product_lifecycle', 'Maturity')) if pd.notna(row.get('product_lifecycle')) else None
            db_product.competitor_price = float(row.get('competitor_price', 0)) if pd.notna(row.get('competitor_price')) else None
            db_product.average_rating = float(row.get('average_rating', 0)) if pd.notna(row.get('average_rating')) else None
            db_product.review_count = int(row.get('review_count', 0)) if pd.notna(row.get('review_count')) else None
            db_product.historical_sales = int(row.get('historical_sales', 0)) if pd.notna(row.get('historical_sales')) else None
            db_product.profit_margin = float(row.get('profit_margin', 0)) if pd.notna(row.get('profit_margin')) else None
            db_product.supplier_name = str(row.get('supplier_name', 'Unknown')) if pd.notna(row.get('supplier_name')) else None
            
        db.commit()
        print(f"Database sync complete! Inserted {insert_count} new products, Updated {upsert_count} existing products.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during synchronization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_db()
