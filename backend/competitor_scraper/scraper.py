import requests
import time
from datetime import datetime, timezone
from typing import List
from .config import logger, USER_AGENT, TIMEOUT, MAX_RETRIES, RATE_LIMIT_DELAY
from .models import CompetitorProduct
from .parsers.book_parser import BookParser

class Scraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
    
    def fetch_page(self, url: str) -> str:
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Fetching URL: {url} (Attempt {attempt+1}/{MAX_RETRIES})")
                response = self.session.get(url, timeout=TIMEOUT)
                response.raise_for_status()
                return response.text
            except requests.RequestException as e:
                logger.warning(f"Error fetching {url}: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RATE_LIMIT_DELAY * (attempt + 1))
        
        logger.error(f"Failed to fetch {url} after {MAX_RETRIES} attempts.")
        return None
    
    def scrape_products(self, urls: List[str]) -> List[CompetitorProduct]:
        products = []
        for url in urls:
            html = self.fetch_page(url)
            if html:
                try:
                    parsed_data = BookParser.parse_product_page(html, url)
                    parsed_data["scraped_at"] = datetime.now(timezone.utc)
                    product = CompetitorProduct(**parsed_data)
                    products.append(product)
                    logger.info(f"Successfully scraped: {product.product_name}")
                except Exception as e:
                    logger.error(f"Error parsing {url}: {e}")
            
            # Rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
        return products
