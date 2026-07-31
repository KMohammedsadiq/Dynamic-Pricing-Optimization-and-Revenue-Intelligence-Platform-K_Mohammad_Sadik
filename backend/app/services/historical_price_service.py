import pandas as pd
import numpy as np
import logging
import os

logger = logging.getLogger("HistoricalPriceService")

# Build absolute paths relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "final_retail_pricing_demand_inr_clean.csv.xlsx")

class HistoricalPriceService:
    def __init__(self):
        self.df = None
        self._load_data()

    def _load_data(self):
        try:
            logger.info("Loading historical INR pricing dataset into memory...")
            self.df = pd.read_excel(DATA_PATH)

            # Normalize column name: new dataset uses 'sales_channel', code expects 'channel'
            if 'sales_channel' in self.df.columns and 'channel' not in self.df.columns:
                self.df.rename(columns={'sales_channel': 'channel'}, inplace=True)

            # Impute promotion_type just as we did for ML
            self.df['promotion_type'] = self.df['promotion_type'].fillna("No Promotion")
            logger.info(f"Historical INR dataset loaded successfully. {len(self.df)} records.")
        except Exception as e:
            logger.error(f"Failed to load historical dataset: {e}")

    def analyze(self, category: str, brand: str, region: str, season: str, base_price: float) -> dict:
        if self.df is None:
            return {"matching_records": 0, "message": "Historical data is unavailable."}

        # Calculate price band (+/- 10%)
        min_price = base_price * 0.90
        max_price = base_price * 1.10

        # Base filter (Price Band + Category)
        base_subset = self.df[
            (self.df['base_price'] >= min_price) &
            (self.df['base_price'] <= max_price) &
            (self.df['category'] == category)
        ]

        # Level 1: Strict Match (Category + Brand + Region + Season + Price Band)
        subset = base_subset[
            (base_subset['brand'] == brand) &
            (base_subset['region'] == region) &
            (base_subset['season'] == season)
        ]
        match_level = "Strict (Category + Brand + Region + Season + Price Band)"

        # Level 2: Relaxed Match (Category + Brand + Price Band)
        if len(subset) < 20:
            subset = base_subset[base_subset['brand'] == brand]
            match_level = "Relaxed (Category + Brand + Price Band)"

        # Level 3: Broad Match (Category + Price Band)
        if len(subset) < 20:
            subset = base_subset
            match_level = "Broad (Category + Price Band)"

        if subset.empty:
            return {
                "matching_records": 0,
                "message": "No similar historical products found."
            }

        # Compute statistics — prices are natively in INR, no conversion needed
        stats = {
            "matching_records": len(subset),
            "match_level": match_level,
            "average_price": round(subset['current_price'].mean(), 2),
            "highest_price": round(subset['current_price'].max(), 2),
            "lowest_price": round(subset['current_price'].min(), 2),
            "median_price": round(subset['current_price'].median(), 2),
            "price_std_dev": round(subset['current_price'].std(), 2) if len(subset) > 1 else 0.0,
            "average_demand_index": round(subset['demand_index'].mean(), 2),
            "average_inventory": int(subset['inventory_level'].mean()),
            "most_common_promotion": subset['promotion_type'].mode().iloc[0] if not subset['promotion_type'].mode().empty else None,
            "most_common_channel": subset['channel'].mode().iloc[0] if not subset['channel'].mode().empty else None
        }

        return stats

# Singleton instance
historical_price_service = HistoricalPriceService()
