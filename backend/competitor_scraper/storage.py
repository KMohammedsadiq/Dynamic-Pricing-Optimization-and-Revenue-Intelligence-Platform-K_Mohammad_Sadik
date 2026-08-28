import json
import os
from typing import List
from datetime import datetime
from .models import CompetitorProduct

class Storage:
    def __init__(self, filepath: str = "competitor_data.json"):
        self.filepath = filepath
        self.seen_urls = set()
        
    def save(self, products: List[CompetitorProduct]):
        # Load existing
        existing_data = []
        if os.path.exists(self.filepath):
            with open(self.filepath, 'r', encoding='utf-8') as f:
                try:
                    existing_data = json.load(f)
                    for item in existing_data:
                        self.seen_urls.add(item.get("product_url"))
                except json.JSONDecodeError:
                    pass
        
        # Prevent duplicates based on URL
        new_data = []
        for product in products:
            if product.product_url not in self.seen_urls:
                # Convert datetime to ISO string for JSON serialization
                dumped = product.model_dump(mode='json')
                new_data.append(dumped)
                self.seen_urls.add(product.product_url)
        
        all_data = existing_data + new_data
        
        with open(self.filepath, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=4)
        
        return len(new_data)
