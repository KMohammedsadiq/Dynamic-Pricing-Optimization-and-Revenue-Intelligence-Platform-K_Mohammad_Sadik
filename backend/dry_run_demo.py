import os
import sys
import hashlib
from decimal import Decimal

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.product_catalog import ProductCatalog
from app.models.competitor_price import CompetitorPriceHistory

def generate_demo_price(product_id: str, base_price: float, is_amazon: bool) -> Decimal:
    """Generate deterministic product-specific Amazon and Flipkart snapshot prices."""
    salt = "AMZ" if is_amazon else "FK"
    hash_input = f"{product_id}_{salt}".encode('utf-8')
    hash_val = int(hashlib.md5(hash_input).hexdigest()[:8], 16)
    
    variation = -0.05 + (0.20 * (hash_val / 0xFFFFFFFF))
    final_price = base_price * (1 + variation)
    return Decimal(str(round(final_price, 2)))

def main():
    db = SessionLocal()
    
    existing_records = db.query(CompetitorPriceHistory).all()
    updated_existing = 0
    for record in existing_records:
        if not record.data_source:
            record.data_source = "EXISTING_VERIFIED"
            updated_existing += 1
            
    products = db.query(ProductCatalog).all()
    
    missing_amazon = 0
    missing_flipkart = 0
    demo_records_to_create = 0
    existing_preserved = len(existing_records)
    
    for product in products:
        amz_exists = db.query(CompetitorPriceHistory).filter_by(
            product_id=product.product_id,
            competitor_name="Amazon"
        ).first()
        
        fk_exists = db.query(CompetitorPriceHistory).filter_by(
            product_id=product.product_id,
            competitor_name="Flipkart"
        ).first()
        
        base_price = float(product.base_price) if product.base_price else 1000.0
        
        if not amz_exists:
            missing_amazon += 1
            demo_records_to_create += 1
            
        if not fk_exists:
            missing_flipkart += 1
            demo_records_to_create += 1

    print("--- DRY RUN REPORT ---")
    print(f"Total products: {len(products)}")
    print(f"Products missing Amazon: {missing_amazon}")
    print(f"Products missing Flipkart: {missing_flipkart}")
    print(f"Existing records preserved: {existing_preserved}")
    print(f"Null data_source fields to be set to EXISTING_VERIFIED: {updated_existing}")
    print(f"DEMO_SNAPSHOT records that would be created: {demo_records_to_create}")

if __name__ == "__main__":
    main()
