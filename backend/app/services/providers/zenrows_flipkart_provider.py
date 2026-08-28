import logging
import requests
import urllib.parse
import json
import re
from bs4 import BeautifulSoup

from app.core.config import settings
from app.services.providers.base import CompetitorDataProvider, CandidateProduct, RetrievalResult

logger = logging.getLogger(__name__)

class ZenRowsFlipkartProvider(CompetitorDataProvider):
    @property
    def name(self) -> str:
        return "ZenRows Flipkart India"

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
            query_parts = []
            if brand and brand.strip():
                query_parts.append(brand.strip())
            if product_name and product_name.strip():
                query_parts.append(product_name.strip())
            query = " ".join(query_parts)
            queries = [query]
            
        all_extracted_candidates = []
        seen_urls = set()
        total_credits = 0
        successful_queries = 0
        
        result.metadata["queries_run"] = []
        
        for query in queries:
            encoded_query = urllib.parse.quote_plus(query)
            flipkart_url = f"https://www.flipkart.com/search?q={encoded_query}"
            
            logger.info(f"[ZenRows Flipkart] Running Query: '{query}'")
        
            zenrows_url = 'https://api.zenrows.com/v1/'
            params = {
                'url': flipkart_url,
                'apikey': api_key,
                'autoparse': 'false', # Must be false to get raw HTML for generic DOM traversal
            }
            
            zenrows_mode = getattr(settings, 'ZENROWS_MODE', 'cost_optimized')
            if zenrows_mode != 'cost_optimized':
                params['premium_proxy'] = 'true'
                
            retry_count = 0
            max_retries = 1 if zenrows_mode == 'cost_optimized' else 0
            
            while retry_count <= max_retries:
                try:
                    response = requests.get(zenrows_url, params=params, timeout=60)
                    result.http_status = response.status_code
                    
                    credits_consumed = int(response.headers.get('Zenrows-Usage', '0'))
                    total_credits += credits_consumed
                    
                    result.metadata["queries_run"].append({"query": query, "credits": credits_consumed, "status": response.status_code, "premium_proxy": params.get('premium_proxy', 'false')})
                    logger.info(f"[ZenRows Flipkart] Query '{query}' HTTP Status: {response.status_code}, Credits: {credits_consumed}, Proxy: {params.get('premium_proxy', 'false')}")
                    
                    if response.status_code == 429:
                        result.error = "ZENROWS_RATE_LIMITED"
                        break
                    elif response.status_code in [401, 403]:
                        result.error = "ZENROWS_AUTH_ERROR"
                        break
                    elif response.status_code in [503, 403]:
                        if retry_count < max_retries and not params.get('premium_proxy'):
                            logger.info(f"[ZenRows Flipkart] Access blocked (HTTP {response.status_code}). Escalating to premium_proxy.")
                            params['premium_proxy'] = 'true'
                            retry_count += 1
                            continue
                        else:
                            result.error = f"ZENROWS_RETRIEVAL_ERROR: Access Blocked (HTTP {response.status_code})"
                            break
                    elif response.status_code != 200:
                        result.error = f"ZENROWS_RETRIEVAL_ERROR: HTTP {response.status_code}"
                        break
                        
                    successful_queries += 1
                    result.accessible = True
                    break # Break retry loop on success
                
                except requests.exceptions.RequestException as e:
                    logger.error(f"[ZenRows Flipkart] Request Exception for query '{query}': {e}")
                    result.error = "ZENROWS_NETWORK_ERROR"
                    break
                    
            if not result.accessible:
                continue
            
            # ── Parse and Extract Candidates ────────────────────────────────
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            
            # 1. Map URLs to Product Names via JSON-LD
            url_to_name = {}
            ld_list = soup.find_all('script', type='application/ld+json')
            for ld in ld_list:
                try:
                    data = json.loads(ld.string)
                    if isinstance(data, list):
                        for item in data:
                            if item.get('@type') == 'ItemList':
                                for prod in item.get('itemListElement', []):
                                    if prod.get('url') and prod.get('name'):
                                        # Normalize URL for matching
                                        u = prod['url'].replace('https://www.flipkart.com', '')
                                        url_to_name[u] = prod['name']
                    elif data.get('@type') == 'ItemList':
                        for prod in data.get('itemListElement', []):
                            if prod.get('url') and prod.get('name'):
                                u = prod['url'].replace('https://www.flipkart.com', '')
                                url_to_name[u] = prod['name']
                except Exception:
                    pass
            
            # 2. Extract Prices via Generic DOM Structure
            product_links = soup.find_all('a', href=re.compile(r'/p/'))
            
            extracted_for_query = 0
            for link in product_links:
                href = link.get('href')
                if not href: continue
                
                full_url = "https://www.flipkart.com" + href if href.startswith('/') else href
                if full_url in seen_urls:
                    continue
                    
                # Find Title (Fallback to JSON-LD first, then img alt, then generic inner text)
                title = url_to_name.get(href)
                if not title:
                    img = link.find('img')
                    if img and img.get('alt'):
                        title = img.get('alt')
                    else:
                        title_elem = link.find('div')
                        if title_elem:
                            title = title_elem.get_text(strip=True)
                            
                if not title:
                    continue
                    
                # Find Price
                text_content = link.get_text(separator=' | ')
                parent_text = link.parent.parent.get_text(separator=' | ') if link.parent and link.parent.parent else ""
                prices = re.findall(r'₹([0-9,]+)', text_content + parent_text)
                
                if not prices:
                    continue
                    
                try:
                    price = float(prices[0].replace(',', ''))
                    
                    # Product ID from URL
                    pid = None
                    pid_match = re.search(r'pid=([A-Z0-9]+)', href)
                    if pid_match:
                        pid = pid_match.group(1)
                        
                    cp = CandidateProduct(
                        title=title,
                        price=price,
                        url=full_url,
                        brand="Flipkart",
                        product_id=pid,
                        raw_price_text=f"₹{prices[0]}"
                    )
                    all_extracted_candidates.append(cp)
                    seen_urls.add(full_url)
                    extracted_for_query += 1
                except ValueError:
                    pass
                    
            result.metadata["queries_run"][-1]["candidates_found"] = extracted_for_query
                
        result.content_usable = len(all_extracted_candidates) > 0
        result.candidates = all_extracted_candidates
        result.metadata["total_credits_consumed"] = total_credits
        result.metadata["total_unique_candidates"] = len(all_extracted_candidates)
        logger.info(f"[ZenRows Flipkart] Extracted {len(all_extracted_candidates)} total unique viable candidates using {total_credits} credits.")
        return result
