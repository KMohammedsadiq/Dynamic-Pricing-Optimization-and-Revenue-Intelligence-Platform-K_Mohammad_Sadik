import pandas as pd
from sqlalchemy import create_engine
import math
import sys
import os

# 1. Ask the user for the External Database URL
print("\n" + "="*60)
print("  ☁️   PricePilot Cloud Database Uploader  ☁️")
print("="*60 + "\n")
print("To bypass Render's 512MB free-tier memory limit, this script will use your")
print("computer's RAM to process the massive CSV file and stream it directly")
print("into your cloud database in tiny, safe chunks!\n")

# 1. External Database URL (Hardcoded)
db_url = "postgresql://pricepilot:OSeZ9U3ozLkNLeyiVWzndVDHji2p9Koa@dpg-daidhnnqj5pc739lhs50-a.oregon-postgres.render.com/pricepilot_db_axkh"

# 2. CSV file path (Hardcoded)
csv_file = "retail_price_optimization_dataset_improved.csv"

if not os.path.exists(csv_file):
    print(f"\n❌ Could not find file '{csv_file}' in the current folder!")
    sys.exit(1)

print("\n🚀 Connecting to the cloud database...")
try:
    engine = create_engine(db_url)
    # Test connection
    with engine.connect() as conn:
        pass
    print("✅ Successfully connected to cloud database!")
except Exception as e:
    print(f"\n❌ Failed to connect to database. Make sure you used the EXTERNAL URL. Error: {e}")
    sys.exit(1)

print(f"\n📦 Analyzing {csv_file}...")
chunk_size = 2000
total_rows = sum(1 for row in open(csv_file, 'r', encoding='utf-8')) - 1
total_chunks = math.ceil(total_rows / chunk_size)

print(f"📊 Found {total_rows:,} rows. Processing in {total_chunks} chunks to save memory...\n")

# 3. Stream and insert data directly into the database
try:
    chunk_iterator = pd.read_csv(csv_file, chunksize=chunk_size)
    
    for i, chunk in enumerate(chunk_iterator, 1):
        # Data Cleaning just like the backend does
        chunk.columns = chunk.columns.str.lower()
        if 'product_id' not in chunk.columns:
            print("\n❌ Invalid CSV format! Missing 'product_id' column.")
            sys.exit(1)
            
        # Ensure dates are parsed correctly
        if 'date' in chunk.columns:
            chunk['date'] = pd.to_datetime(chunk['date'], errors='coerce')
            
        # Match database schema
        chunk = chunk.rename(columns={'sales_channel': 'channel'})
        chunk = chunk.drop(columns=['day_of_week', 'month'], errors='ignore')
            
        # Write directly to the 'products' table safely
        chunk.to_sql('products', db_url, if_exists='append', index=False, method='multi')
        
        # --- AUTO-SYNC TO CATALOG ---
        # Get unique products in this chunk to sync to the Product Catalog
        unique_products = chunk.drop_duplicates(subset=['product_id'])
        catalog_chunk = pd.DataFrame({
            'product_id': unique_products['product_id'],
            'product_name': unique_products['product_id'],
            'category': unique_products.get('category'),
            'brand': unique_products.get('brand'),
            'base_price': unique_products.get('base_price', 0),
            'current_price': unique_products.get('current_price'),
            'initial_inventory': unique_products.get('inventory_level', 0),
            'status': 'Active'
        })
        
        # We can't use to_sql 'append' directly if duplicates exist across chunks.
        # So we write to a temporary table and then do an INSERT DO NOTHING (Postgres).
        # To keep it simple in pandas, we'll fetch existing catalog IDs and filter locally!
        existing_catalog = pd.read_sql("SELECT product_id FROM product_catalog", db_url)
        new_catalog = catalog_chunk[~catalog_chunk['product_id'].isin(existing_catalog['product_id'])]
        
        if not new_catalog.empty:
            new_catalog.to_sql('product_catalog', db_url, if_exists='append', index=False, method='multi')
        
        # Calculate percentage
        percent = (i / total_chunks) * 100
        print(f"✅ Uploaded chunk {i}/{total_chunks} ({percent:.1f}% complete) - Sent {len(chunk):,} rows...")
        
    print("\n🎉 SUCCESS! All products have been successfully uploaded to your live cloud database!")
    print("👉 You can now go to your Vercel dashboard and refresh the page to see your data!")
    
except Exception as e:
    print(f"\n❌ An error occurred during upload: {e}")
