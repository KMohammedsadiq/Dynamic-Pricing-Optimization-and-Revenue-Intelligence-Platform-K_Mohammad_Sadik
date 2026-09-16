import os, sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/pricepilot_ai")
print(f"Connecting to: {DATABASE_URL[:50]}...")

import sqlalchemy as sa
engine = sa.create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Step 1: Updating product names from historical data...")
    r1 = conn.execute(sa.text("""
        UPDATE product_catalog pc
        SET product_name = sub.product_name
        FROM (
            SELECT DISTINCT ON (product_id) product_id, product_name
            FROM products
            WHERE product_name IS NOT NULL AND product_name != product_id
            ORDER BY product_id, product_name
        ) sub
        WHERE pc.product_id = sub.product_id
          AND (pc.product_name IS NULL OR pc.product_name = pc.product_id)
    """))
    print(f"  -> {r1.rowcount} product names updated")

    print("Step 2: Updating cost_price from historical averages...")
    r2 = conn.execute(sa.text("""
        UPDATE product_catalog pc
        SET cost_price = sub.avg_cost
        FROM (
            SELECT product_id, AVG(cost_price) as avg_cost
            FROM products
            WHERE cost_price IS NOT NULL AND cost_price > 0
            GROUP BY product_id
        ) sub
        WHERE pc.product_id = sub.product_id
          AND (pc.cost_price IS NULL OR pc.cost_price = 0)
    """))
    print(f"  -> {r2.rowcount} cost prices updated")

    print("Step 3: Updating current_price from historical averages...")
    r3 = conn.execute(sa.text("""
        UPDATE product_catalog pc
        SET current_price = sub.avg_price
        FROM (
            SELECT product_id, AVG(current_price) as avg_price
            FROM products
            WHERE current_price > 0
            GROUP BY product_id
        ) sub
        WHERE pc.product_id = sub.product_id
          AND (pc.current_price IS NULL OR pc.current_price = 0)
    """))
    print(f"  -> {r3.rowcount} current prices updated")

    conn.commit()
    print("\nDone! Verifying sample...")
    rows = conn.execute(sa.text(
        "SELECT product_id, product_name, cost_price, current_price FROM product_catalog LIMIT 8"
    )).fetchall()
    for row in rows:
        print(f"  {row[0]} | {row[1]} | cost={row[2]:.0f} | price={row[3]:.0f}")
