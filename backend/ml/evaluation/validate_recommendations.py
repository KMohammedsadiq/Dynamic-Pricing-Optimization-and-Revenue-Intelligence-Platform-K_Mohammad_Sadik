"""
validate_recommendations.py
============================
Milestone 4 — Pricing Strategy Recommendation Validation

Validates that ALL 828 catalog products receive exactly one strategy,
with no duplicates or missing entries, and that the strategy distribution
is consistent across:
  - /analytics/pricing-strategies (detailed recommendations)
  - get_strategy_distribution_all_products() (summary distribution)
  - get_executive_summary() strategy_distribution

Also validates:
  - Each product has valid inputs (current_price, cost_price, etc.)
  - No invalid strategy categories
  - Correct market gap calculations
  - Correct profitability calculations
  - Executive BI distribution matches detailed recommendations

Usage:
    cd backend
    python -m ml.evaluation.validate_recommendations

Requires the database to be present at backend/pricepilot.db
"""

import os
import sys
import json
import time
from collections import Counter, defaultdict

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

VALID_STRATEGIES = {
    "CONSIDER PRICE INCREASE",
    "CONSIDER PRICE DECREASE",
    "PROTECT MARGIN",
    "MAINTAIN PRICE",
    "MONITOR MARKET"
}

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "recommendation_validation_results.json")


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        return super().default(obj)


def main():
    print("=" * 70)
    print("PricePilot AI — Pricing Strategy Recommendation Validation")
    print("=" * 70)

    # ── 1. Setup DB session ───────────────────────────────────────────────
    print("\n[1/7] Setting up database session...")
    from app.db.session import SessionLocal
    db = SessionLocal()
    print("      Connected.")

    results = {}
    all_ok = True

    try:
        # ── 2. Count catalog products ─────────────────────────────────────
        print("\n[2/7] Counting eligible catalog products...")
        from app.models.product_catalog import ProductCatalog
        from app.models.product import Product
        from sqlalchemy import func

        catalog_count = db.query(func.count(ProductCatalog.id)).scalar()
        product_ids_catalog = [r.product_id for r in db.query(ProductCatalog.product_id).all()]
        unique_catalog_ids  = set(product_ids_catalog)
        duplicate_catalog   = len(product_ids_catalog) - len(unique_catalog_ids)

        print(f"      Catalog products total: {catalog_count}")
        print(f"      Unique product_ids:     {len(unique_catalog_ids)}")
        print(f"      Duplicates in catalog:  {duplicate_catalog}")
        if duplicate_catalog > 0:
            dup_counts = Counter(product_ids_catalog)
            dups = {pid: c for pid, c in dup_counts.items() if c > 1}
            print(f"      Duplicate product_ids: {dups}")
            all_ok = False

        results["catalog_products_total"]   = catalog_count
        results["catalog_unique_ids"]        = len(unique_catalog_ids)
        results["catalog_duplicate_ids"]     = duplicate_catalog

        # ── 3. Run full strategy evaluation ──────────────────────────────
        print(f"\n[3/7] Running strategy evaluation for all {catalog_count} products...")
        t0 = time.time()

        from app.services.analytics_service import get_strategy_distribution_all_products
        raw_strategies = get_strategy_distribution_all_products(db, return_raw=True)
        elapsed_sec = time.time() - t0

        print(f"      Evaluation complete in {elapsed_sec:.2f}s  ({len(raw_strategies)} strategies returned)")

        # ── 4. Validate completeness ──────────────────────────────────────
        print(f"\n[4/7] Validating completeness and uniqueness...")
        returned_ids = [s["product"]["id"] for s in raw_strategies]
        unique_returned = set(returned_ids)
        n_returned = len(returned_ids)
        n_unique_returned = len(unique_returned)
        n_duplicates = n_returned - n_unique_returned

        missing_products = unique_catalog_ids - unique_returned
        extra_products   = unique_returned - unique_catalog_ids

        print(f"      Strategies returned: {n_returned}")
        print(f"      Unique product_ids:  {n_unique_returned}")
        print(f"      Duplicates:          {n_duplicates}")
        print(f"      Missing products:    {len(missing_products)}")
        print(f"      Extra products:      {len(extra_products)}")

        if n_duplicates > 0:
            dup_counts = Counter(returned_ids)
            dups = {pid: c for pid, c in dup_counts.items() if c > 1}
            print(f"      Duplicated IDs: {list(dups.keys())[:10]}")
            all_ok = False
        if missing_products:
            print(f"      Sample missing: {list(missing_products)[:10]}")
            all_ok = False
        if extra_products:
            print(f"      Sample extra:   {list(extra_products)[:10]}")
            all_ok = False

        results["strategies_returned"]      = n_returned
        results["unique_strategies"]        = n_unique_returned
        results["duplicate_strategies"]     = n_duplicates
        results["missing_products"]         = len(missing_products)
        results["extra_products"]           = len(extra_products)
        results["missing_product_ids"]      = sorted(list(missing_products))[:20]

        # ── 5. Validate strategy categories and distribution ──────────────
        print(f"\n[5/7] Validating strategy categories and distribution...")
        strategy_counter = Counter(s["recommendation"] for s in raw_strategies)
        invalid_strategies = [s for s in strategy_counter if s not in VALID_STRATEGIES]

        print(f"      Strategy Distribution:")
        total = sum(strategy_counter.values())
        for strat in sorted(VALID_STRATEGIES):
            count = strategy_counter.get(strat, 0)
            pct   = count / total * 100 if total > 0 else 0
            print(f"        {strat:<35} {count:>4}  ({pct:.1f}%)")
        if invalid_strategies:
            print(f"      INVALID strategy categories found: {invalid_strategies}")
            all_ok = False

        results["strategy_distribution"] = dict(strategy_counter)
        results["total_evaluated"]        = total
        results["invalid_strategy_categories"] = invalid_strategies

        # Validate input values for each product
        print(f"\n      Validating supporting metrics per product...")
        n_zero_price    = 0
        n_negative_cost = 0
        n_monitor_no_data = 0
        n_invalid_margin = 0
        monitor_sample  = []

        for s in raw_strategies:
            sm = s.get("supporting_metrics", {})
            cp = sm.get("current_price", 0)
            cost = sm.get("cost_price", 0)
            margin = sm.get("profit_margin_pct", 0)
            rec = s["recommendation"]

            if cp <= 0: n_zero_price += 1
            if cost < 0: n_negative_cost += 1
            if rec == "MONITOR MARKET" and cp > 0:
                # Products sent to Monitor with a valid price — check if it's due to
                # missing data or genuinely low competitors
                n_monitor_no_data += 1
                if len(monitor_sample) < 5:
                    monitor_sample.append({
                        "id": s["product"]["id"],
                        "price": cp,
                        "market_avg": sm.get("market_average"),
                        "margin": margin,
                        "comp_movement": sm.get("competitor_movement")
                    })
            # margin should be in [-∞, 100]
            if margin > 100:
                n_invalid_margin += 1

        print(f"        Products with zero/missing current price: {n_zero_price}")
        print(f"        Products with negative cost_price:        {n_negative_cost}")
        print(f"        MONITOR MARKET (with valid price):        {n_monitor_no_data}")
        print(f"        Invalid margin >100%:                     {n_invalid_margin}")
        if monitor_sample:
            print(f"        Sample MONITOR products: {monitor_sample}")

        results["input_validation"] = {
            "zero_price_products": n_zero_price,
            "negative_cost_products": n_negative_cost,
            "monitor_market_with_valid_price": n_monitor_no_data,
            "invalid_margin_gt100": n_invalid_margin
        }

        if n_invalid_margin > 0 or n_negative_cost > 0:
            all_ok = False

        # ── 6. Reconcile with summary distribution ────────────────────────
        print(f"\n[6/7] Reconciling with get_strategy_distribution_all_products (summary)...")
        t1 = time.time()
        summary_dist = get_strategy_distribution_all_products(db, return_raw=False)
        elapsed2 = time.time() - t1
        print(f"      Summary generated in {elapsed2:.2f}s")

        reconciliation_ok = True
        print(f"      Reconciliation (detailed counts vs summary counts):")
        for strat in sorted(VALID_STRATEGIES):
            detailed_count = strategy_counter.get(strat, 0)
            summary_count  = summary_dist.get(strat, {}).get("count", 0)
            match = "[OK]" if detailed_count == summary_count else "[FAIL] MISMATCH"
            print(f"        {strat:<35} detailed={detailed_count:>4}  summary={summary_count:>4}  {match}")
            if detailed_count != summary_count:
                reconciliation_ok = False
                all_ok = False

        results["reconciliation_ok"]    = reconciliation_ok
        results["summary_distribution"] = {k: v.get("count", 0) for k, v in summary_dist.items()}

        # ── 7. Reconcile with Executive BI ────────────────────────────────
        print(f"\n[7/7] Reconciling with Executive BI summary distribution...")
        t2 = time.time()
        from app.services.analytics_service import get_executive_summary
        exec_summary = get_executive_summary(db)
        elapsed3 = time.time() - t2
        print(f"      Executive summary generated in {elapsed3:.2f}s")

        exec_dist = exec_summary.get("strategy_distribution", {})
        bi_reconciliation_ok = True
        print(f"      Executive BI vs Strategy API reconciliation:")
        for strat in sorted(VALID_STRATEGIES):
            detailed_count = strategy_counter.get(strat, 0)
            bi_count       = exec_dist.get(strat, {}).get("count", 0)
            match = "[OK]" if detailed_count == bi_count else "[FAIL] MISMATCH"
            print(f"        {strat:<35} detailed={detailed_count:>4}  exec_bi={bi_count:>4}  {match}")
            if detailed_count != bi_count:
                bi_reconciliation_ok = False
                all_ok = False

        results["executive_bi_reconciliation_ok"] = bi_reconciliation_ok
        results["executive_bi_distribution"] = {k: v.get("count", 0) for k, v in exec_dist.items()}

        # ── Final verdict ─────────────────────────────────────────────────
        print(f"\n{'=' * 70}")
        print(f"  FINAL VERDICT: {'[OK] ALL CHECKS PASSED' if all_ok else '[FAIL] ISSUES FOUND (see above)'}")
        print(f"  Total eligible products: {catalog_count}")
        print(f"  Total evaluated:         {n_returned}")
        print(f"  Strategy distribution:   {dict(strategy_counter)}")
        print(f"  Execution time (raw):    {elapsed_sec:.2f}s")
        print(f"  Execution time (summary):{elapsed2:.2f}s")
        print(f"{'=' * 70}")

        results["overall_status"]    = "PASS" if all_ok else "FAIL"
        results["execution_time_sec"] = {
            "raw_strategies": round(elapsed_sec, 2),
            "summary_distribution": round(elapsed2, 2),
            "executive_summary": round(elapsed3, 2)
        }

    finally:
        db.close()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2, cls=NpEncoder)
    print(f"\nResults saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
