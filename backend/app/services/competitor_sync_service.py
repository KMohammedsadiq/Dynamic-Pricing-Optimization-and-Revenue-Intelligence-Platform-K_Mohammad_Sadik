"""
competitor_sync_service.py — Orchestrates competitor price sync via SerpApi.

Architecture:
    CompetitorSyncService
          ↓
    SerpApiProvider → Google Shopping (India)
          ↓
    Multiple merchant candidates (Amazon, Flipkart, Croma, etc.)
          ↓
    Product Matching Engine (matching_utils.py) per merchant
          ↓
    CompetitorPriceHistory (DB)
          ↓
    Frontend

Key behaviors:
- Cache-first: return DB data within cooldown window
- Per-merchant matching: each retailer is evaluated independently
- On RATE_LIMITED: return cached data, never break the UI
- Prices come from SerpApi structured data only — never fabricated
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from app.models.competitor_price import CompetitorPriceHistory
from app.core.config import settings
from app.services.matching_utils import find_best_match
from app.services.providers.base import CandidateProduct, RetrievalResult
from app.services.providers.zenrows_provider import ZenRowsProvider

logger = logging.getLogger(__name__)

# ── Status constants (consumed by frontend StatusBadge) ──────────────────────
STATUS_LIVE            = "success"
STATUS_CACHED          = "cached"
STATUS_COOLDOWN        = "cooldown"
STATUS_NO_MATCH        = "no_verified_match"
STATUS_PRICE_NOT_FOUND = "price_not_found"
STATUS_BLOCKED         = "blocked"
STATUS_RATE_LIMITED    = "rate_limited"
STATUS_RETRIEVAL_ERROR = "retrieval_error"
STATUS_AUTH_ERROR      = "auth_error"
STATUS_NO_DATA         = "no_data"

# Retailers we always want to show in the UI (even if no data)
PRIMARY_COMPETITORS = ["Amazon", "Flipkart"]


class CompetitorSyncService:
    def __init__(self, db: Session):
        self.db = db
        from app.services.providers.zenrows_flipkart_provider import ZenRowsFlipkartProvider
        self.amazon_provider = ZenRowsProvider()
        self.flipkart_provider = ZenRowsFlipkartProvider()

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _get_latest_record(self, product_id: str, comp_name: str):
        return (
            self.db.query(CompetitorPriceHistory)
            .filter(
                CompetitorPriceHistory.product_id == product_id,
                CompetitorPriceHistory.competitor_name == comp_name,
            )
            .order_by(CompetitorPriceHistory.scraped_at.desc())
            .first()
        )

    def _is_in_cooldown(self, latest_record) -> bool:
        if not latest_record:
            return False
        last_time = latest_record.last_checked_at or latest_record.scraped_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        cooldown = timedelta(seconds=settings.COMPETITOR_SYNC_COOLDOWN_SECONDS)
        return datetime.now(timezone.utc) - last_time < cooldown

    def _build_cached_result(self, record, status: str, message: str) -> dict:
        return {
            "status":          status,
            "message":         message,
            "price":           float(record.price) if record.price else None,
            "url":             record.competitor_url,
            "title":           record.competitor_product_name,
            "confidence":      record.match_confidence,
            "scraped_at":      record.scraped_at.isoformat() if record.scraped_at else None,
            "last_checked_at": record.last_checked_at.isoformat() if record.last_checked_at else None,
        }

    def _save_price(self, product_id: str, competitor: str, price: float,
                    url: str, title: str, confidence: int):
        """
        Insert a new price row only when the price changes.
        If identical price, update last_checked_at only (no duplicate rows).
        """
        latest = self._get_latest_record(product_id, competitor)
        if latest and latest.price is not None and float(latest.price) == price:
            # Only skip inserting a new row if we already have a record for today
            today = datetime.now(timezone.utc).date()
            latest_date = latest.scraped_at.date() if latest.scraped_at else None
            
            if latest_date == today:
                latest.last_checked_at = func.now()
                self.db.commit()
                return
                
        entry = CompetitorPriceHistory(
            product_id=product_id,
            competitor_name=competitor,
            price=price,
            competitor_url=url,
            competitor_product_name=title,
            match_confidence=confidence,
            is_available=True,
        )
        self.db.add(entry)
        self.db.commit()

    # ── Core sync ─────────────────────────────────────────────────────────────

    def sync_product(self, product_id: str, product_name: str, brand: str,
                     category: str = "", product_model: str = "", variant: str = "", force: bool = False) -> dict:
        """
        Cache-first sync via provider.
        """
        results = {}
        
        # Fetch the product from DB to get structured attributes
        from app.models.product_catalog import ProductCatalog
        product_record = self.db.query(ProductCatalog).filter_by(product_id=product_id).first()
        internal_product = {}
        if product_record:
            internal_product = {
                "product_name": product_record.product_name,
                "product_model": product_record.product_model,
                "cpu": product_record.cpu,
                "ram": product_record.ram,
                "storage": product_record.storage,
                "size": product_record.size,
                "gender": product_record.gender,
                "color": product_record.color,
                "isbn": product_record.isbn,
            }
        else:
            internal_product = {
                "product_name": product_name,
                "product_model": product_model,
            }

        # ── 1. Check cooldown for primary competitors ─────────────────────────
        all_in_cooldown = True
        for comp in PRIMARY_COMPETITORS:
            latest = self._get_latest_record(product_id, comp)
            if not force and self._is_in_cooldown(latest):
                results[comp] = self._build_cached_result(
                    latest,
                    status=STATUS_COOLDOWN,
                    message=f"Cached price — live refresh in ~{settings.COMPETITOR_SYNC_COOLDOWN_SECONDS}s.",
                )
            else:
                all_in_cooldown = False

        if all_in_cooldown and not force:
            logger.info(f"[Sync] All competitors in cooldown for {product_id}. Returning cache.")
            return results

        # ── 2. Build Multiple Queries ──────────────────────────────────────────
        queries = []
        base_query = product_name.strip()
        
        # Override with marketplace_search_name if it exists
        if product_record and product_record.marketplace_search_name:
            best_query = product_record.marketplace_search_name.strip()
            logger.info(f"[Sync] Using marketplace_search_name: '{best_query}'")
        else:
            if brand and brand.strip() and brand.strip().lower() not in product_name.lower():
                base_query = f"{brand.strip()} {product_name.strip()}"
            
            # Build the most specific query possible to minimize API calls and reduce sync time
            best_query = base_query
            if product_model and isinstance(product_model, str):
                if product_model.strip().lower() not in base_query.lower():
                    best_query = f"{base_query} {product_model}".strip()
                        
            if variant and isinstance(variant, str):
                best_query = f"{best_query} {variant}".strip()
                
        queries.append(best_query)
                
        logger.info(f"[Sync] Calling Providers for '{product_id}' with queries: {queries}")
        import concurrent.futures
        
        all_candidates = []
        combined_metadata = {}
        
        def run_provider(provider):
            return provider, provider.get_candidates(
                product_name=product_name,
                brand=brand,
                category=category,
                queries=queries,
            )
            
        providers = []
        if "Amazon" not in results:
            providers.append(self.amazon_provider)
        if "Flipkart" not in results:
            providers.append(self.flipkart_provider)
            
        if not providers:
            logger.info(f"[Sync] All providers served from cache for '{product_id}'.")
            return results
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_to_provider = {executor.submit(run_provider, p): p for p in providers}
            for future in concurrent.futures.as_completed(future_to_provider):
                provider, retrieval = future.result()
                
                # ── 3. Handle provider-level failures per provider ─────────────────────
                if not retrieval.accessible:
                    error_msg = retrieval.error or "Unknown retrieval error"
                    logger.error(f"[Sync] {provider.name} failed for {product_id}: {error_msg}")
                    
                    if "RATE_LIMITED" in error_msg:
                        fail_status = STATUS_RATE_LIMITED
                    elif "AUTH_ERROR" in error_msg:
                        fail_status = STATUS_AUTH_ERROR
                    else:
                        fail_status = STATUS_RETRIEVAL_ERROR
                        
                    # Which primary competitor does this provider correspond to?
                    # ZenRowsProvider -> Amazon, ZenRowsFlipkartProvider -> Flipkart
                    comp = "Amazon" if "Amazon" in provider.name else "Flipkart"
                    if comp not in results:
                        latest = self._get_latest_record(product_id, comp)
                        if latest:
                            results[comp] = self._build_cached_result(
                                latest,
                                status=fail_status,
                                message=f"Live retrieval unavailable ({error_msg}). Showing last cached price.",
                            )
                        else:
                            results[comp] = {
                                "status":  fail_status,
                                "message": error_msg,
                            }
                else:
                    all_candidates.extend(retrieval.candidates)
                    combined_metadata[provider.name] = retrieval.metadata

        # ── 4. Group candidates by merchant ───────────────────────────────────
        candidates_by_merchant = self._group_by_merchant(all_candidates)
        logger.info(
            f"[Sync] Merchants found: {list(candidates_by_merchant.keys())} "
            f"({len(all_candidates)} total candidates)"
        )

        # ── 5. Match per merchant ─────────────────────────────────────────────
        # Process all merchants returned by SerpApi, but always include primaries
        merchants_to_process = set(PRIMARY_COMPETITORS) | set(candidates_by_merchant.keys())

        for comp_name in merchants_to_process:
            # Skip if already served from cache
            if comp_name in results:
                continue

            merchant_candidates = candidates_by_merchant.get(comp_name, [])

            if not merchant_candidates:
                latest = self._get_latest_record(product_id, comp_name)
                if latest:
                    results[comp_name] = self._build_cached_result(
                        latest,
                        status=STATUS_CACHED,
                        message="Merchant not in current search results. Showing last cached price.",
                    )
                else:
                    results[comp_name] = {
                        "status":  STATUS_NO_MATCH,
                        "message": f"{comp_name} not found in Google Shopping results.",
                    }
                continue

            # Run matching engine
            matching_input = [
                {
                    "title":         c.title,
                    "product_title": c.title,
                    "price":         c.price,
                    "url":           c.url,
                    "asin":          c.product_id,
                }
                for c in merchant_candidates
            ]

            match_result = find_best_match(internal_product, brand, matching_input)
            best = match_result["best_match"]
            diagnostics = match_result["diagnostics"]

            if not best:
                logger.info(f"[Sync] {comp_name}: no verified match for {product_id}")
                results[comp_name] = {
                    "status":  STATUS_NO_MATCH,
                    "message": f"No verified matching product found on {comp_name} (confidence below threshold).",
                    "diagnostics": diagnostics,
                    "metadata": combined_metadata
                }
                continue

            price      = best.get("price")
            url        = best.get("url")
            title      = best.get("title") or best.get("product_title")
            confidence = best.get("match_confidence")

            if price is None:
                logger.warning(f"[Sync] {comp_name}: matched '{title}' but price not extractable.")
                results[comp_name] = {
                    "status":     STATUS_PRICE_NOT_FOUND,
                    "message":    f"Matched '{title}' but price could not be confidently extracted.",
                    "title":      title,
                    "url":        url,
                    "confidence": confidence,
                    "diagnostics": diagnostics,
                    "metadata": combined_metadata
                }
                continue

            # Save to DB and return live result
            # Phase 4 DB Rules: store competitor_url, ASIN inside the URL field if no URL?
            # Wait, our DB model CompetitorPriceHistory only has competitor_url.
            # I will pass both url or ASIN string into DB if possible, or append ?asin= to url.
            # Since ZenRows URL is fully reconstructed (https://www.amazon.in/dp/{asin}), it's safe.
            self._save_price(product_id, comp_name, price, url, title, confidence)
            now = datetime.now(timezone.utc).isoformat()
            results[comp_name] = {
                "status":          STATUS_LIVE,
                "price":           price,
                "url":             url,
                "title":           title,
                "confidence":      confidence,
                "asin":            best.get("asin"),
                "scraped_at":      now,
                "last_checked_at": now,
                "diagnostics":     diagnostics,
                "metadata":        combined_metadata
            }
            logger.info(f"[Sync] {comp_name} SUCCESS for {product_id}: ₹{price} ({confidence}% confidence)")

        return results

    # ── Cache-only lookup ─────────────────────────────────────────────────────

    def get_cached_prices(self, product_id: str) -> dict:
        """Return latest cached prices per competitor without any SerpApi call."""
        result = {}
        for comp_name in PRIMARY_COMPETITORS:
            latest = self._get_latest_record(product_id, comp_name)
            if latest:
                result[comp_name] = self._build_cached_result(
                    latest, status=STATUS_CACHED, message="Last successfully fetched price."
                )
            else:
                result[comp_name] = {
                    "status":  STATUS_NO_DATA,
                    "message": "No data yet. Click Sync to fetch.",
                }
        return result

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _group_by_merchant(candidates: list) -> dict:
        """
        Group CandidateProduct objects by their source/merchant name.
        Uses the 'brand' field which SerpApiProvider sets to item['source'].
        Normalizes common merchant name variants.
        """
        MERCHANT_NORMALIZER = {
            "amazon.in":          "Amazon",
            "amazon":             "Amazon",
            "flipkart.com":       "Flipkart",
            "flipkart":           "Flipkart",
            "myntra.com":         "Myntra",
            "myntra":             "Myntra",
            "croma.com":          "Croma",
            "croma":              "Croma",
            "reliancedigital":    "Reliance Digital",
            "reliance digital":   "Reliance Digital",
            "tatacliq.com":       "Tata Cliq",
            "tata cliq":          "Tata Cliq",
            "nykaa.com":          "Nykaa",
            "nykaa":              "Nykaa",
            "ajio.com":           "Ajio",
            "ajio":               "Ajio",
            "meesho.com":         "Meesho",
            "meesho":             "Meesho",
        }

        grouped: dict = {}
        for c in candidates:
            raw_source = (c.brand or "Unknown").strip().lower()
            # Try to normalize
            normalized = MERCHANT_NORMALIZER.get(raw_source)
            if not normalized:
                # Partial match
                for key, val in MERCHANT_NORMALIZER.items():
                    if key in raw_source:
                        normalized = val
                        break
            if not normalized:
                # Capitalize as-is
                normalized = (c.brand or "Unknown").strip().title()

            grouped.setdefault(normalized, []).append(c)

        return grouped
