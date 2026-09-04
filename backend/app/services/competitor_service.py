"""
competitor_service.py
Provides the market intelligence aggregation logic as a reusable service function.
Used by:
  - app/api/endpoints/competitors.py  (Market Intelligence endpoint)
  - app/services/analytics_service.py (Executive BI summary)

This is the single source of truth for all market position, competitor movement,
and pricing gap calculations. Do NOT duplicate this logic elsewhere.
"""
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.competitor_price import CompetitorPriceHistory
from app.models.product_catalog import ProductCatalog


def get_market_intelligence_data(db: Session) -> dict:
    """
    Computes full market intelligence aggregations from existing DB data only.
    Uses 2 SQL queries + in-memory computation — no N+1, no external API calls.
    TEST_HISTORICAL records are excluded from market intelligence (isolation preserved).

    Returns the same structure that the /competitors/market-intelligence API returns.
    """
    # ── 1. Load all catalog products (one query) ─────────────────────────────
    products = db.query(ProductCatalog).filter(ProductCatalog.is_deleted == False).all()
    product_map = {p.product_id: p for p in products}

    # ── 2. Load all competitor history ordered oldest → newest (one query) ────
    history = (
        db.query(
            CompetitorPriceHistory.product_id,
            CompetitorPriceHistory.competitor_name,
            CompetitorPriceHistory.price,
            CompetitorPriceHistory.scraped_at,
            CompetitorPriceHistory.data_source
        )
        .order_by(CompetitorPriceHistory.scraped_at.asc())
        .all()
    )

    # Per-product, per-competitor ordered history
    latest_any = {}   # (product_id, competitor) -> most recent record (excl TEST)
    all_real = defaultdict(list)
    all_test = defaultdict(list)

    for h in history:
        key = (h.product_id, h.competitor_name)

        # Prevent TEST_HISTORICAL from contaminating Market Intelligence
        if h.data_source != 'TEST_HISTORICAL':
            latest_any[key] = h   # newest because ordered asc

        if h.data_source == 'TEST_HISTORICAL':
            all_test[key].append(h)
        elif h.data_source != 'DEMO_SNAPSHOT':
            all_real[key].append(h)

    # Movement data — prefer test movement for demo, fallback to real
    movement_data = {}

    for key, records in all_real.items():
        if len(records) >= 2:
            movement_data[key] = {'prev': records[-2], 'curr': records[-1]}

    for key, records in all_test.items():
        if len(records) >= 2:
            movement_data[key] = {'prev': records[-2], 'curr': records[-1]}

    # ── 3. Per-product aggregates ─────────────────────────────────────────────
    total_products = len(products)
    amazon_covered = 0
    flipkart_covered = 0
    all_market_prices = []

    movement_counts = {
        'Amazon':   {'increased': 0, 'decreased': 0, 'unchanged': 0, 'insufficient': 0},
        'Flipkart': {'increased': 0, 'decreased': 0, 'unchanged': 0, 'insufficient': 0},
    }

    cheaper_count   = 0
    near_count      = 0
    expensive_count = 0
    no_data_count   = 0

    cat_our   = defaultdict(list)
    cat_amz   = defaultdict(list)
    cat_fkp   = defaultdict(list)

    opportunities = []

    for p in products:
        pid = p.product_id
        our_price = float(p.base_price) if p.base_price else None
        category  = p.category or 'Uncategorized'

        amz_rec = latest_any.get((pid, 'Amazon'))
        fkp_rec = latest_any.get((pid, 'Flipkart'))
        amz_price = float(amz_rec.price) if amz_rec else None
        fkp_price = float(fkp_rec.price) if fkp_rec else None

        if amz_price is not None:
            amazon_covered += 1
        if fkp_price is not None:
            flipkart_covered += 1

        for comp in ('Amazon', 'Flipkart'):
            key = (pid, comp)
            if key in movement_data:
                prev_p = float(movement_data[key]['prev'].price)
                curr_p = float(movement_data[key]['curr'].price)
                if curr_p > prev_p:
                    movement_counts[comp]['increased'] += 1
                elif curr_p < prev_p:
                    movement_counts[comp]['decreased'] += 1
                else:
                    movement_counts[comp]['unchanged'] += 1
            else:
                movement_counts[comp]['insufficient'] += 1

        competitor_prices = [x for x in [amz_price, fkp_price] if x is not None]
        if competitor_prices and our_price:
            avg_market = sum(competitor_prices) / len(competitor_prices)
            all_market_prices.append(avg_market)
            gap_pct = ((our_price - avg_market) / avg_market) * 100

            if gap_pct < -3.0:
                cheaper_count += 1
                position = 'cheaper'
            elif gap_pct > 3.0:
                expensive_count += 1
                position = 'expensive'
            else:
                near_count += 1
                position = 'near'

            opportunities.append({
                'product_id':   pid,
                'product_name': p.product_name,
                'category':     category,
                'our_price':    our_price,
                'avg_market':   round(avg_market, 2),
                'gap_pct':      round(gap_pct, 2),
                'position':     position,
            })

            if our_price:  cat_our[category].append(our_price)
            if amz_price:  cat_amz[category].append(amz_price)
            if fkp_price:  cat_fkp[category].append(fkp_price)
        else:
            no_data_count += 1

    # ── 4. Category intelligence table ───────────────────────────────────────
    category_intelligence = []
    all_cats = set(cat_our.keys()) | set(cat_amz.keys()) | set(cat_fkp.keys())
    for cat in sorted(all_cats):
        our_list = cat_our.get(cat, [])
        amz_list = cat_amz.get(cat, [])
        fkp_list = cat_fkp.get(cat, [])
        combined = amz_list + fkp_list

        avg_our    = sum(our_list) / len(our_list) if our_list else None
        avg_amz    = sum(amz_list) / len(amz_list) if amz_list else None
        avg_fkp    = sum(fkp_list) / len(fkp_list) if fkp_list else None
        avg_market = sum(combined)  / len(combined)  if combined  else None

        avg_gap_pct = None
        if avg_our and avg_market:
            avg_gap_pct = round(((avg_our - avg_market) / avg_market) * 100, 2)

        cat_products = [o for o in opportunities if o['category'] == cat]
        cat_cheaper  = sum(1 for o in cat_products if o['position'] == 'cheaper')
        cat_near     = sum(1 for o in cat_products if o['position'] == 'near')
        cat_exp      = sum(1 for o in cat_products if o['position'] == 'expensive')
        cat_total    = len(cat_products)

        if avg_market and avg_our:
            if avg_our < avg_market * 0.97:
                cat_position = 'cheaper'
            elif avg_our > avg_market * 1.03:
                cat_position = 'expensive'
            else:
                cat_position = 'near'
        else:
            cat_position = 'no_data'

        category_intelligence.append({
            'category':        cat,
            'products':        cat_total,
            'avg_our_price':   round(avg_our, 2)    if avg_our    else None,
            'avg_amazon':      round(avg_amz, 2)    if avg_amz    else None,
            'avg_flipkart':    round(avg_fkp, 2)    if avg_fkp    else None,
            'avg_market':      round(avg_market, 2) if avg_market else None,
            'avg_gap_pct':     avg_gap_pct,
            'position':        cat_position,
            'cheaper_count':   cat_cheaper,
            'near_count':      cat_near,
            'expensive_count': cat_exp,
        })

    category_intelligence.sort(key=lambda x: abs(x['avg_gap_pct'] or 0), reverse=True)

    # ── 5. Top opportunities ──────────────────────────────────────────────────
    top_opportunities = sorted(
        opportunities, key=lambda x: abs(x['gap_pct']), reverse=True
    )[:10]

    # ── 6. Per-product movement ───────────────────────────────────────────────
    product_movement = {}
    for (pid, comp), md in movement_data.items():
        prev_p = float(md['prev'].price)
        curr_p = float(md['curr'].price)
        diff   = curr_p - prev_p
        pct    = (diff / prev_p) * 100 if prev_p else 0
        direction = 'INCREASED' if diff > 0 else ('DECREASED' if diff < 0 else 'UNCHANGED')

        if pid not in product_movement:
            product_movement[pid] = {}
        product_movement[pid][comp] = {
            'prev_price': round(prev_p, 2),
            'curr_price': round(curr_p, 2),
            'diff':       round(diff, 2),
            'pct':        round(pct, 2),
            'direction':  direction,
            'prev_date':  md['prev'].scraped_at.isoformat() if md['prev'].scraped_at else None,
            'curr_date':  md['curr'].scraped_at.isoformat() if md['curr'].scraped_at else None,
        }

    # ── 7. Monitoring records ─────────────────────────────────────────────────
    SIGNIFICANT_THRESHOLD = 5.0

    monitoring_records = []
    for (pid, comp), md in movement_data.items():
        prev_p = float(md['prev'].price)
        curr_p = float(md['curr'].price)
        diff   = curr_p - prev_p
        pct    = (diff / prev_p) * 100 if prev_p else 0
        direction = 'INCREASED' if diff > 0 else ('DECREASED' if diff < 0 else 'UNCHANGED')
        prod = product_map.get(pid)
        monitoring_records.append({
            'product_id':   pid,
            'product_name': prod.product_name if prod else pid,
            'category':     prod.category     if prod else 'Uncategorized',
            'competitor':   comp,
            'prev_price':   round(prev_p, 2),
            'curr_price':   round(curr_p, 2),
            'diff':         round(diff, 2),
            'pct':          round(pct, 2),
            'direction':    direction,
            'prev_date':    md['prev'].scraped_at.isoformat() if md['prev'].scraped_at else None,
            'curr_date':    md['curr'].scraped_at.isoformat() if md['curr'].scraped_at else None,
            'data_source':  md['curr'].data_source,
        })
    monitoring_records.sort(key=lambda r: abs(r['pct']), reverse=True)

    total_changes = sum(
        movement_counts[c]['increased'] + movement_counts[c]['decreased'] + movement_counts[c]['unchanged']
        for c in ('Amazon', 'Flipkart')
    )
    significant_changes = sum(1 for r in monitoring_records if abs(r['pct']) >= SIGNIFICANT_THRESHOLD)

    avg_market_price = round(sum(all_market_prices) / len(all_market_prices), 2) if all_market_prices else None

    # ── 8. Avg gap across all products with data ──────────────────────────────
    all_gap_pcts = [o['gap_pct'] for o in opportunities]
    avg_gap_pct = round(sum(all_gap_pcts) / len(all_gap_pcts), 2) if all_gap_pcts else None

    return {
        'overview': {
            'total_products':         total_products,
            'products_with_data':     len(opportunities),
            'amazon_coverage':        amazon_covered,
            'flipkart_coverage':      flipkart_covered,
            'amazon_coverage_pct':    round((amazon_covered  / total_products) * 100, 1) if total_products else 0,
            'flipkart_coverage_pct':  round((flipkart_covered / total_products) * 100, 1) if total_products else 0,
            'avg_market_price':       avg_market_price,
        },
        'price_movement':    movement_counts,
        'movement_summary': {
            'total_changes':             total_changes,
            'significant_changes':       significant_changes,
            'significant_threshold_pct': SIGNIFICANT_THRESHOLD,
        },
        'monitoring_records':   monitoring_records,
        'market_position': {
            'cheaper':   cheaper_count,
            'near':      near_count,
            'expensive': expensive_count,
            'no_data':   no_data_count,
            'total':     total_products,
        },
        'category_intelligence': category_intelligence,
        'top_opportunities':     top_opportunities,
        'product_movement':      product_movement,
        'avg_gap_pct':           avg_gap_pct,
    }
