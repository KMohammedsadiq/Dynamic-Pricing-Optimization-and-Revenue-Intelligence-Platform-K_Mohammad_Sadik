"""
zenrows_provider.py — Amazon India scraper via ZenRows API.
Implements CompetitorDataProvider using ZenRows' Fetch/Extract architecture.
"""
import logging
import requests
import urllib.parse
from app.core.config import settings
from app.services.providers.base import CompetitorDataProvider, CandidateProduct, RetrievalResult

logger = logging.getLogger(__name__)

class ZenRowsProvider(CompetitorDataProvider):
    @property
    def name(self) -> str:
        return "ZenRows Amazon India"

    def get_candidates(
        self,
        product_name: str,
        brand: str,
        category: str = "",
        queries: list = None,
        **kwargs,
    ) -> RetrievalResult:
        result = RetrievalResult()
        
        api_key = settings.ZENROWS_API_KEY
        if not api_key:
            result.error = "ZENROWS_AUTH_ERROR: API key not configured"
            return result
            
        if not queries:
            # Fallback to single query builder if queries not provided
            query_parts = []
            if brand and brand.strip():
                query_parts.append(brand.strip())
            if product_name and product_name.strip():
                query_parts.append(product_name.strip())
            query = " ".join(query_parts)
            queries = [query]
            
        all_extracted_candidates = []
        seen_asins = set()
        total_credits = 0
        successful_queries = 0
        
        result.metadata["queries_run"] = []
        
        for query in queries:
            encoded_query = urllib.parse.quote_plus(query)
            amazon_url = f"https://www.amazon.in/s?k={encoded_query}"
            
            logger.info(f"[ZenRows] Running Query: '{query}'")
        
            # ── 2. Retrieval ──────────────────────────────────────────────────────
            zenrows_url = 'https://api.zenrows.com/v1/'
            params = {
                'url': amazon_url,
                'apikey': api_key,
                'autoparse': 'true',
                'premium_proxy': 'true', 
            }
            
            try:
                response = requests.get(zenrows_url, params=params, timeout=60)
                result.http_status = response.status_code
                
                credits_consumed = int(response.headers.get('Zenrows-Usage', '0'))
                total_credits += credits_consumed
                
                result.metadata["queries_run"].append({"query": query, "credits": credits_consumed, "status": response.status_code})
                logger.info(f"[ZenRows] Query '{query}' HTTP Status: {response.status_code}, Credits: {credits_consumed}")
                
                if response.status_code == 429:
                    result.error = "ZENROWS_RATE_LIMITED"
                    break
                elif response.status_code in [401, 403]:
                    result.error = "ZENROWS_AUTH_ERROR"
                    break
                elif response.status_code != 200:
                    result.error = f"ZENROWS_RETRIEVAL_ERROR: HTTP {response.status_code}"
                    if "amazon" in response.text.lower() or "captcha" in response.text.lower():
                        result.block_reason = "Amazon challenge/block"
                    continue
                    
                successful_queries += 1
                result.accessible = True
            
                # ── 3. Parse and Extract Candidates ────────────────────────────────
                try:
                    data = response.json()
                except Exception:
                    logger.error(f"[ZenRows] Failed to parse JSON for query '{query}'")
                    continue
                    
                candidates_data = data.get('results', data) if isinstance(data, dict) else data
                if not isinstance(candidates_data, list):
                    candidates_data = [candidates_data]
                    
                if not candidates_data:
                    logger.info(f"[ZenRows] Request successful but no results found for query '{query}'.")
                    continue
                    
                result.content_usable = True
                
                extracted_for_query = 0
                for cand in candidates_data:
                    title = cand.get('title') or cand.get('name')
                    price_str = cand.get('price')
                    
                    if not title or not price_str:
                        continue
                        
                    # Clean Price
                    price = None
                    try:
                        if isinstance(price_str, (int, float)):
                            price = float(price_str)
                        else:
                            clean_price = price_str.replace('₹', '').replace('Rs.', '').replace(',', '').strip()
                            price = float(clean_price)
                    except ValueError:
                        continue
                        
                    # ASIN and URL logic
                    asin = cand.get('asin')
                    url = cand.get('url') or cand.get('link')
                    
                    if asin and asin in seen_asins:
                        continue
                        
                    if asin:
                        seen_asins.add(asin)
                    
                    # Reconstruct Amazon URL safely if missing but ASIN is present
                    if not url and asin:
                        url = f"https://www.amazon.in/dp/{asin}"
                    elif url and url.startswith('/'):
                        url = "https://www.amazon.in" + url
                        
                    # Map into standard CandidateProduct
                    cp = CandidateProduct(
                        title=title,
                        price=price,
                        url=url,
                        brand="Amazon",  # Forced to Amazon for this provider
                        product_id=asin,
                        raw_price_text=str(price_str)
                    )
                    all_extracted_candidates.append(cp)
                    extracted_for_query += 1
                    
                result.metadata["queries_run"][-1]["candidates_found"] = extracted_for_query
                
            except requests.exceptions.RequestException as e:
                logger.error(f"[ZenRows] Request Exception for query '{query}': {e}")
                result.error = "ZENROWS_NETWORK_ERROR"
                break
                
        result.candidates = all_extracted_candidates
        result.metadata["total_credits_consumed"] = total_credits
        result.metadata["total_unique_candidates"] = len(all_extracted_candidates)
        logger.info(f"[ZenRows] Extracted {len(all_extracted_candidates)} total unique viable candidates using {total_credits} credits.")
        return result
