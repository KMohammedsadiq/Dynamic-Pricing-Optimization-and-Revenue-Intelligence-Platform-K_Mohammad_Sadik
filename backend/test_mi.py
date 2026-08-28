import os, sys, io
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from main import app
from fastapi.testclient import TestClient
from app.api.deps import get_current_user_token

app.dependency_overrides[get_current_user_token] = lambda: {'user_id': 1}
client = TestClient(app)

resp = client.get('/api/v1/competitors/market-intelligence')
data = resp.json()

ov = data['overview']
pm = data['price_movement']
mp = data['market_position']
ci = data['category_intelligence']
to = data['top_opportunities']
mv = data['product_movement']

print("=== OVERVIEW ===")
print(f"  Total products:      {ov['total_products']}")
print(f"  Products w/ data:    {ov['products_with_data']}")
print(f"  Amazon coverage:     {ov['amazon_coverage']} ({ov['amazon_coverage_pct']}%)")
print(f"  Flipkart coverage:   {ov['flipkart_coverage']} ({ov['flipkart_coverage_pct']}%)")
print(f"  Avg market price:    INR {ov['avg_market_price']}")

print("\n=== PRICE MOVEMENT ===")
for marketplace, counts in pm.items():
    print(f"  {marketplace}: up={counts['increased']} decreased={counts['decreased']} unchanged={counts['unchanged']} insufficient={counts['insufficient']}")

print("\n=== MARKET POSITION ===")
print(f"  Cheaper: {mp['cheaper']}, Near: {mp['near']}, Expensive: {mp['expensive']}, No data: {mp['no_data']}")

print(f"\n=== CATEGORY INTELLIGENCE ({len(ci)} categories) ===")
for c in ci[:5]:
    print(f"  {c['category']}: {c['products']} products, Our avg {c['avg_our_price']}, Market avg {c['avg_market']}, Gap {c['avg_gap_pct']}% [{c['position']}]")

print(f"\n=== TOP 5 OPPORTUNITIES ===")
for o in to[:5]:
    print(f"  {o['product_id']} | {o['product_name'][:35]} | Our {o['our_price']} | Market {o['avg_market']} | Gap {o['gap_pct']}% [{o['position']}]")

print("\n=== SPOT CHECKS ===")
for pid in ['ELE003', 'DEMO001', 'DEMO011']:
    mv_entry = mv.get(pid, {})
    for comp in ['Amazon', 'Flipkart']:
        m = mv_entry.get(comp)
        if m:
            print(f"  {pid} {comp}: {m['direction']} {m['pct']}% ({m['prev_price']} -> {m['curr_price']})")
        else:
            print(f"  {pid} {comp}: no movement data (real observations < 2)")
