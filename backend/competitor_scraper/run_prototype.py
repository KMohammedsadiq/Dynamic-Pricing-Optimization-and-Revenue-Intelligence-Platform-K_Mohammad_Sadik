import os
import sys

# Add backend to path for module resolution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from competitor_scraper.scraper import Scraper
from competitor_scraper.storage import Storage
from competitor_scraper.config import logger

def run():
    logger.info("Starting Competitor Scraper Prototype")
    
    test_urls = [
        "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
        "http://books.toscrape.com/catalogue/tipping-the-velvet_999/index.html",
        "http://books.toscrape.com/catalogue/soumission_998/index.html"
    ]
    
    scraper = Scraper()
    storage_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraped_books_prototype.json")
    storage = Storage(filepath=storage_path)
    
    products = scraper.scrape_products(test_urls)
    
    if products:
        new_count = storage.save(products)
        logger.info(f"Prototype finished. Saved {new_count} new products to {storage_path}")
    else:
        logger.warning("No products scraped.")

if __name__ == "__main__":
    run()
