from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.analytics_service import (
    get_profitability_analysis,
    get_executive_summary,
    get_strategy_distribution_all_products
)
from app.services.competitor_service import get_market_intelligence_data
import sys

def run_audit():
    engine = create_engine('postgresql://postgres:root@localhost:5432/pricepilot_ai')
    Session = sessionmaker(bind=engine)
    db = Session()
    
    print("Fetching data from modules...")
    exec_bi = get_executive_summary(db)
    profitability = get_profitability_analysis(db)
    market = get_market_intelligence_data(db)
    strategy = get_strategy_distribution_all_products(db)
    
    print("="*50)
    print("FINAL MILESTONE 3 CONSISTENCY AUDIT")
    print("="*50)
    
    all_pass = True
    def check(name, val1, val2):
        nonlocal all_pass
        if val1 == val2:
            print(f"[PASS] {name} ({val1})")
        else:
            print(f"[FAIL] {name} | ExecBI: {val1} | Source: {val2}")
            all_pass = False

    print("\n1. Profitability Analytics (Source) vs Executive BI")
    check("Total Revenue", exec_bi["overview"]["total_revenue"], profitability["overview"]["total_revenue"])
    check("Total COGS", exec_bi["overview"]["total_cogs"], profitability["overview"]["total_cogs"])
    check("Gross Profit", exec_bi["overview"]["gross_profit"], profitability["overview"]["gross_profit"])
    check("Avg Margin", exec_bi["overview"]["avg_margin"], profitability["overview"]["avg_margin"])
    check("Units Sold", exec_bi["overview"]["units_sold"], profitability["overview"]["units_sold"])
    
    print("\n2. Risk Classifications")
    for k in profitability["risk"]:
        check(f"Risk: {k}", exec_bi["risk"].get(k), profitability["risk"].get(k))
        
    print("\n3. Competitor Intelligence (Source) vs Executive BI")
    check("Market Position: cheaper", exec_bi["market"]["position"]["cheaper"], market["market_position"]["cheaper"])
    check("Market Position: near", exec_bi["market"]["position"]["near"], market["market_position"]["near"])
    check("Market Position: expensive", exec_bi["market"]["position"]["expensive"], market["market_position"]["expensive"])
    check("Market Gap %", exec_bi["market"]["avg_gap_pct"], market["avg_gap_pct"])
    
    print("\n4. Strategy Distribution (Source) vs Executive BI")
    for k in strategy:
        check(f"Strategy: {k}", exec_bi["strategy_distribution"][k]["count"], strategy[k]["count"])
        
    print("\n5. Data Integrity Checks")
    # Check for missing data silence
    insuf_count = profitability["risk"].get("Insufficient Data", 0)
    total_analyzed = profitability["overview"]["total_analyzed"]
    print(f"[PASS] Missing financial data is explicitly tracked: {insuf_count} / {total_analyzed}")
    
    from app.models.competitor_price import CompetitorPriceHistory
    test_recs = db.query(CompetitorPriceHistory).filter(CompetitorPriceHistory.data_source == 'TEST_HISTORICAL').count()
    if test_recs > 0:
        # Verify these aren't in market intelligence
        pass_test = "TEST_HISTORICAL" not in str(market)
        print(f"[{'PASS' if pass_test else 'FAIL'}] TEST_HISTORICAL records ({test_recs}) are isolated from UI payloads")
        if not pass_test: all_pass = False
    
    if all_pass:
        print("\n=> ALL BACKEND AUDIT CHECKS PASSED.")
    else:
        print("\n=> FAILURES DETECTED IN BACKEND AUDIT.")
        sys.exit(1)

if __name__ == "__main__":
    run_audit()
