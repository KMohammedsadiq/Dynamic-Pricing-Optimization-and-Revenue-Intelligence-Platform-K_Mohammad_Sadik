import os
import sys

# Setup paths so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.product_catalog import ProductCatalog

def run():
    db = SessionLocal()
    try:
        demos = db.query(ProductCatalog).filter(ProductCatalog.product_id.like('DEMO%')).all()
        if not demos:
            print("No DEMO products found.")
            return

        print(f"Found {len(demos)} DEMO products.")
        
        # We need to map roughly 5 per category to be marketplace_ready
        category_counts = {}
        
        # Hardcoded specific examples from the prompt
        specific_examples = {
            "DEMO001": "Apple iPhone 15 128GB",
            "DEMO002": "Samsung Galaxy M35 5G",
            "DEMO009": "Logitech M331 Silent Plus Wireless Mouse",
            "DEMO011": "Tata Salt 1 kg",
            "DEMO012": "Aashirvaad Shudh Chakki Atta 5 kg",
            "DEMO032": "Levi's Men's 511 Slim Fit Jeans",
            "DEMO041": "Nike Air Zoom Pegasus Running Shoes",
            "DEMO081": "Atomic Habits James Clear",
        }
        
        ready_count = 0
        updated_count = 0
        ready_list = []
        
        for p in demos:
            cat = p.category or "Unknown"
            
            # Construct a better search name
            search_name = p.product_name
            if p.product_id in specific_examples:
                search_name = specific_examples[p.product_id]
            else:
                parts = []
                if p.brand and p.brand.lower() not in search_name.lower():
                    parts.append(p.brand)
                parts.append(search_name)
                
                if p.gender and p.gender.lower() not in search_name.lower():
                    parts.append(p.gender)
                    
                if p.variant and p.variant.lower() not in search_name.lower():
                    parts.append(p.variant)
                    
                if p.storage and p.storage.lower() not in search_name.lower():
                    parts.append(p.storage)
                elif p.ram and p.ram.lower() not in search_name.lower():
                    parts.append(p.ram)
                    
                if p.size and p.size.lower() not in search_name.lower():
                    parts.append(p.size)
                    
                if p.weight and p.weight.lower() not in search_name.lower():
                    parts.append(p.weight)
                    
                if p.author and p.author.lower() not in search_name.lower():
                    parts.append(p.author)
                    
                search_name = " ".join(parts).strip()
            
            p.marketplace_search_name = search_name
            
            # Select ~5 per category
            cat_count = category_counts.get(cat, 0)
            if cat_count < 5:
                p.marketplace_ready = True
                category_counts[cat] = cat_count + 1
                ready_count += 1
                ready_list.append((p.product_id, p.product_name, cat, search_name))
            else:
                p.marketplace_ready = False
                
            updated_count += 1
            
        db.commit()
        
        print(f"Updated {updated_count} products with marketplace_search_name.")
        print(f"Marked {ready_count} products as marketplace_ready.")
        print("\nReady Products:")
        for r in ready_list:
            print(f"{r[0]} | {r[1]} | {r[2]} | {r[3]}")
            
    finally:
        db.close()

if __name__ == "__main__":
    run()
