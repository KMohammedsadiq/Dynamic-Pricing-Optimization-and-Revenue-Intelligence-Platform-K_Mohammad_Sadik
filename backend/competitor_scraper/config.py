import logging

# Scraper Configuration
BASE_URL = "http://books.toscrape.com"
USER_AGENT = "PricePilot-CompetitorScraper-Prototype/1.0 (Contact: admin@pricepilot.local)"
TIMEOUT = 10 # seconds
MAX_RETRIES = 3
RATE_LIMIT_DELAY = 1.0 # seconds between requests

def setup_logger():
    logger = logging.getLogger("competitor_scraper")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)
    return logger

logger = setup_logger()
