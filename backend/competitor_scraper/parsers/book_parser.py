from bs4 import BeautifulSoup
from typing import Dict, Any

class BookParser:
    @staticmethod
    def parse_product_page(html_content: str, url: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        try:
            product_name = soup.find("h1").text.strip()
            
            # Breadcrumb for category
            breadcrumb = soup.find("ul", class_="breadcrumb")
            category = None
            if breadcrumb:
                links = breadcrumb.find_all("a")
                if len(links) >= 3:
                    category = links[2].text.strip()
            
            import re
            
            price_element = soup.find("p", class_="price_color")
            price_text = price_element.text.strip() if price_element else ""
            # Use regex to extract currency symbol and amount
            match = re.search(r'([^\d\.,]+)?([\d\.,]+)', price_text)
            if match:
                curr_symbol = match.group(1)
                amount = match.group(2)
                currency = curr_symbol.replace("Â", "").strip() if curr_symbol else "£"
                price = float(amount)
            else:
                currency = "£"
                price = 0.0
            
            availability_element = soup.find("p", class_="instock availability")
            availability = availability_element.text.strip() if availability_element else "Unknown"
            
            # Clean up availability string (e.g., "In stock (22 available)" -> "In stock")
            if "In stock" in availability:
                availability = "In stock"
            elif "Out of stock" in availability:
                availability = "Out of stock"
            
            image_element = soup.find("div", id="product_gallery").find("img")
            image_url = image_element["src"].replace("../../", "http://books.toscrape.com/") if image_element else None
            
            return {
                "competitor_name": "Books To Scrape",
                "product_name": product_name,
                "brand": "N/A",  # Not provided on this site
                "category": category,
                "price": price,
                "currency": currency,
                "availability": availability,
                "product_url": url,
                "image_url": image_url
            }
        except Exception as e:
            raise ValueError(f"Failed to parse product page: {e}")
