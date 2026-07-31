# PricePilot AI - Historical Price Intelligence Report

This report documents the implementation of the Historical Price Intelligence Service (Step 6), which analyzes historical data to provide real-world context for our pricing algorithms. This service acts as the foundation for the upcoming Business Recommendation Engine.

## 1. Matching Logic
The service filters the historical dataset (172,800 records) to find identical or similar products based on four core parameters provided in the request payload:
- **`category`**: Ensures we are comparing similar items (e.g., Electronics to Electronics).
- **`brand`**: Accounts for brand premium (e.g., Samsung vs Generic).
- **`region`**: Accounts for regional purchasing power and currency.
- **`season`**: Accounts for temporal demand shifts (e.g., Winter vs Spring).

*Note: `current_price` is explicitly ignored during matching because the goal is to discover the historical distribution of prices, not to find matches for a specific price point.*

## 2. Statistics Calculated
For all matching historical records, the service computes a comprehensive set of metrics:
1. **Total Matching Records**
2. **Average Selling Price** (Mean)
3. **Median Selling Price** (50th Percentile)
4. **Highest Selling Price** (Max)
5. **Lowest Selling Price** (Min)
6. **Price Standard Deviation** (Volatility)
7. **Average Demand Index**
8. **Average Inventory Level**
9. **Most Common Promotion Type** (Mode)
10. **Most Common Sales Channel** (Mode)

## 3. API Endpoint Details
**Endpoint**: `POST /api/v1/historical-price-analysis`

### Example Request
```json
{
    "category": "Electronics",
    "brand": "Samsung",
    "region": "US",
    "season": "Winter"
}
```

### Example Response
```json
{
    "matching_records": 354,
    "average_price": 228.91,
    "highest_price": 411.04,
    "lowest_price": 37.52,
    "median_price": 257.95,
    "price_std_dev": 123.46,
    "average_demand_index": 119.47,
    "average_inventory": 270.0,
    "most_common_promotion": "No Promotion",
    "most_common_channel": "web",
    "message": null
}
```

## 4. Performance & Reliability
- **Singleton Loading**: The 100,000+ row dataset is loaded into a Pandas DataFrame **once** when FastAPI boots up. Incoming API requests execute sub-millisecond filtering logic rather than experiencing heavy disk I/O.
- **Graceful Fallbacks**: If a user submits a combination of category/brand/region that does not exist in the dataset, the service gracefully returns `0` matching records and a user-friendly message rather than crashing the application.

## 5. Future Enhancements
- **Dynamic Fallback Matching**: Future iterations will implement progressive fallback strategies if strict matching yields too few records.
  - **Level 1 (Strict)**: `category` + `brand` + `region` + `season`
  - **Level 2 (Relaxed)**: `category` + `brand`
  - **Level 3 (Broad)**: `category`
  This ensures the Business Recommendation Engine always has a robust statistical baseline even for extremely niche or unseen combinations.
