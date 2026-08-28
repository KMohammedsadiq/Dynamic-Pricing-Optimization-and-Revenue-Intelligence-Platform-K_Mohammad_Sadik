import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db.session import SessionLocal
from app.models.product_catalog import ProductCatalog
from app.models.competitor_price import CompetitorPriceHistory

db = SessionLocal()

products = db.query(ProductCatalog).all()
history = db.query(CompetitorPriceHistory).order_by(CompetitorPriceHistory.scraped_at.desc()).all()

latest_amz = {}
latest_fk = {}

for h in history:
    if h.competitor_name == 'Amazon' and h.product_id not in latest_amz:
        latest_amz[h.product_id] = h
    elif h.competitor_name == 'Flipkart' and h.product_id not in latest_fk:
        latest_fk[h.product_id] = h
        
result = []
for p in products:
    amz = latest_amz.get(p.product_id)
    fk = latest_fk.get(p.product_id)
    result.append({
        'product_id': p.product_id, 'our_price': p.base_price, 
        'amazon_price': amz.price if amz else None, 'amazon_data_source': amz.data_source if amz else None,
        'flipkart_price': fk.price if fk else None, 'flipkart_data_source': fk.data_source if fk else None
    })

print(f'Total returned: {len(result)}')
for r in result:
    if r['product_id'] in ['ELE003', 'DEMO001', 'DEMO011']:
        print(f"{r.get('product_id')}: Our Price: {r.get('our_price')}, Amazon: {r.get('amazon_price')} ({r.get('amazon_data_source')}), Flipkart: {r.get('flipkart_price')} ({r.get('flipkart_data_source')})")
