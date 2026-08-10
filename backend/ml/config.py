import os

# Build absolute paths relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "optimal_price_pipeline.pkl")

PIPELINE_VERSION = "v4.0-XGB-Improved"

# The 17 features expected by the Random Forest Pipeline in this exact order
FEATURE_COLUMNS = [
    'category', 'brand', 'season', 'base_price', 'promotion_type', 
    'inventory_level', 'demand_index', 
    'launch_year', 'days_since_launch', 'product_lifecycle', 'cost_price', 
    'competitor_price', 'average_rating', 'review_count', 'historical_sales', 
    'profit_margin', 'supplier_name'
]

# Sensible defaults for fields that might be missing if product doesn't have them
# Only used if the static product record in DB is missing these fields.
DEFAULT_VALUES = {
    'season': 'Winter',
    'promotion_type': 'No Promotion',
    'inventory_level': 100,
    'demand_index': 100.0,
    'launch_year': 2023,
    'days_since_launch': 365,
    'product_lifecycle': 'Maturity',
    'cost_price': 0.0,
    'competitor_price': 0.0,
    'average_rating': 4.0,
    'review_count': 100,
    'historical_sales': 1000,
    'profit_margin': 20.0,
    'supplier_name': 'Unknown',
    'category': 'Electronics',
    'brand': 'Unknown',
    'base_price': 0.0
}
