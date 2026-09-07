import pandas as pd
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger("HistoricalPriceService")

class HistoricalPriceService:
    def analyze(self, db: Session, product_name: str, product_model: str, category: str, brand: str, region: str, season: str, base_price: float) -> dict:
        try:
            from app.models.product import Product
            # Load into pandas for easier filtering and stats
            # We filter for non-deleted active products
            query = db.query(Product).filter(Product.is_deleted == False)
            df = pd.read_sql(query.statement, db.bind)
        except Exception as e:
            logger.error(f"Failed to load historical data from DB: {e}")
            return {"matching_records": 0, "message": "Historical data is unavailable."}

        if df.empty:
            return {"matching_records": 0, "message": "Historical data is unavailable."}

        # Normalize column name
        if 'sales_channel' in df.columns and 'channel' not in df.columns:
            df.rename(columns={'sales_channel': 'channel'}, inplace=True)

        # Impute promotion_type
        if 'promotion_type' in df.columns:
            df['promotion_type'] = df['promotion_type'].fillna("No Promotion")

        # Convert numerics
        for col in ['base_price', 'current_price', 'demand_index', 'inventory_level']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Calculate price band (+/- 10%)
        min_price = base_price * 0.90
        max_price = base_price * 1.10

        # Base filter (Category + Price Band)
        base_subset = df[
            (df['base_price'] >= min_price) &
            (df['base_price'] <= max_price) &
            (df['category'] == category)
        ]

        # Level 1: Strict Match
        subset = base_subset[
            (base_subset['product_name'] == product_name) &
            (base_subset['product_model'] == product_model) &
            (base_subset['brand'] == brand) &
            (base_subset['region'] == region) &
            (base_subset['season'] == season)
        ]
        match_level = "Strict (Name + Model + Brand + Category + Price Band + Region + Season)"

        # Level 2: High Match
        if len(subset) < 20:
            subset = base_subset[
                (base_subset['product_name'] == product_name) &
                (base_subset['product_model'] == product_model) &
                (base_subset['brand'] == brand)
            ]
            match_level = "High (Name + Model + Brand + Category + Price Band)"

        # Level 3: Medium Match
        if len(subset) < 20:
            subset = base_subset[
                (base_subset['product_name'] == product_name) &
                (base_subset['brand'] == brand)
            ]
            match_level = "Medium (Name + Brand + Category + Price Band)"

        # Level 4: Relaxed Match
        if len(subset) < 20:
            subset = base_subset[base_subset['brand'] == brand]
            match_level = "Relaxed (Brand + Category + Price Band)"

        # Level 5: Broad Match
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
            "average_price": round(float(subset['current_price'].mean()), 2) if not subset['current_price'].isna().all() else 0.0,
            "highest_price": round(float(subset['current_price'].max()), 2) if not subset['current_price'].isna().all() else 0.0,
            "lowest_price": round(float(subset['current_price'].min()), 2) if not subset['current_price'].isna().all() else 0.0,
            "median_price": round(float(subset['current_price'].median()), 2) if not subset['current_price'].isna().all() else 0.0,
            "price_std_dev": round(float(subset['current_price'].std()), 2) if len(subset) > 1 and not subset['current_price'].isna().all() else 0.0,
            "average_demand_index": round(float(subset['demand_index'].mean()), 2) if not subset['demand_index'].isna().all() else 0.0,
            "average_inventory": int(subset['inventory_level'].mean()) if not subset['inventory_level'].isna().all() else 0,
            "most_common_promotion": subset['promotion_type'].mode().iloc[0] if not subset['promotion_type'].mode().empty else None,
            "most_common_channel": subset['channel'].mode().iloc[0] if 'channel' in subset.columns and not subset['channel'].mode().empty else None
        }

        return stats

# Singleton instance
historical_price_service = HistoricalPriceService()
