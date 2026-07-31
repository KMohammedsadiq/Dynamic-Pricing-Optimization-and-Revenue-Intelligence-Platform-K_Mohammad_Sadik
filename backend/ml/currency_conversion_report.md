# PricePilot AI - Currency Conversion Report

This document details the presentation-layer currency conversion architecture implemented for the PricePilot AI platform. 

## 1. Architectural Philosophy

### Why keep the ML Model in USD?
Machine learning models are mathematical abstractions of patterns. The historical dataset (`retail_pricing_demand_100k.csv`) was recorded in USD. If we were to apply an exchange rate multiplier to the dataset *before* training, the model would learn the exact same correlations, but its internal weights and thresholds would become arbitrarily scaled. More importantly, if the exchange rate fluctuates tomorrow, the entire model would have to be retrained from scratch!

By keeping the ML Model strictly in the original base currency (USD), the model remains mathematically pure and statistically stable regardless of global economic shifts.

### Why convert only at the API Response layer?
Currency conversion is purely a presentation concern. The underlying logical pipeline (ML Prediction -> Historical Comparison -> Business Recommendation) all happens in USD. This guarantees that percentages, volatility standard deviations, and business rules (`Predicted Price > Historical Average + 5%`) compute perfectly. 

The Currency Service strictly intercepts the output *just before* it is sent as a JSON response to the React frontend.

## 2. Architecture Diagram

```mermaid
flowchart TD
    A[Historical Dataset (USD)] -->|Trains| B(ML Model)
    A -->|Indexed| C(Historical Service)
    
    D[Incoming API Request] --> E[Prediction Service (USD)]
    E -.-> B
    
    E --> F[Business Recommendation Engine (USD)]
    C --> F
    
    F -->|Raw USD Results| G[Currency Conversion Service]
    G -->|INR Translation| H((JSON API Response))
    H --> I[React Frontend]
```

## 3. Converted vs Unconverted Fields

The API dynamically converts specific numeric nodes across all ML endpoints.

**Fields Converted (USD → INR):**
- `predicted_price`
- `average_price`, `historical_average_price`
- `highest_price`, `lowest_price`, `median_price`
- `price_difference`
- `price_std_dev` (Standard deviation scales linearly with currency multipliers)

**Fields Intentionally NOT Converted:**
- `difference_percentage` (Ratios remain identical regardless of currency)
- `demand_index` (A dimensionless market metric)
- `inventory` (Physical stock count)
- `matching_records` (Count)
- `recommendation` and `reasons` (Text)

## 4. Configuration
All conversion logic routes through a centralized Singleton service (`backend/app/services/currency_service.py`). 
- **Current Exchange Rate Configured**: `1 USD = 83.50 INR`. 
- No hardcoded math exists anywhere else in the repository.
