<div align="center">

# 💰 PricePilot AI

**Dynamic Pricing & Revenue Intelligence Platform for Retail**

*Historical sales data → ML price optimization → demand forecasting → live competitor intelligence → explainable business recommendations — all in one dashboard.*

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-Latest-22B5BF) ![Axios](https://img.shields.io/badge/Axios-Latest-5A29E4?logo=axios&logoColor=white)

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)  ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00) 

![XGBoost](https://img.shields.io/badge/XGBoost-≥1.7-FF6600) 

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white) 
</div>

---


## Why PricePilot AI?

Pricing decisions in retail are complex. A price that is too high kills demand; a price that is too low destroys margin. PricePilot AI solves this by answering one question for every product in the catalog:

**"Given current demand, inventory, competition, and market conditions — what is the most profitable price to set right now?"**

The answer is never just a number. The platform explains *why* through quantified business factors, a confidence score, projected revenue impact, and real-time market positioning data.

---

## Table of Contents

- [System Capabilities](#system-capabilities)
- [Platform Architecture](#platform-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Datasets](#datasets)
- [Feature Engineering](#feature-engineering)
- [Price Optimization Model](#price-optimization-model)
- [Demand Forecasting Engine](#demand-forecasting-engine)
- [Business Recommendation Engine](#business-recommendation-engine)
- [Competitor Intelligence](#competitor-intelligence)
- [REST API](#rest-api)
- [Frontend Dashboard](#frontend-dashboard)
- [End-to-End Data Flow](#end-to-end-data-flow)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [ML Validation Results](#ml-validation-results)
- [Performance Benchmarks](#performance-benchmarks)
- [Limitations & Known Issues](#limitations--known-issues)
- [Security Checklist](#security-checklist)

---

## System Capabilities

| Capability | Description |
|-----------|-------------|
| **AI Price Optimization** | XGBoost v4 pipeline predicts optimal price multiplier from 17 product features |
| **Multi-Horizon Demand Forecasting** | Validated forecasts for 7, 14, 30, and 90-day horizons per product |
| **12-Factor Recommendation Engine** | Categorizes business signals into price-increasing, price-reducing, or neutral factors |
| **Live Competitor Sync** | Real-time price pulls from Amazon and Flipkart via RapidAPI; Google Shopping via SerpApi |
| **Revenue Optimization** | Batch scoring of 828 catalog products ranked by projected revenue uplift |
| **Executive BI** | Category profit bridge, margin table, and printable reports |
| **Seasonal & Holiday Intelligence** | Demand impact analysis for Indian holidays (Diwali, Holi, Eid, Independence Day, etc.) |
| **Role-Based Access Control** | Admin, Pricing Manager, and Business Analyst roles with JWT authentication |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│  Dashboard · Products · Forecasts · Competitors · Analytics  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / Axios (JWT)
┌──────────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend (Python)                    │
│  /auth  /products  /predictions  /analytics  /competitors    │
└────┬────────────┬───────────────┬────────────────┬──────────┘
     │            │               │                │
     ▼            ▼               ▼                ▼
PostgreSQL   XGBoost v4      Demand           Competitor
(Products,   Price Model     Forecasting      Intel Layer
 Sales,      Pipeline        Engine           (RapidAPI,
 Users)      (.pkl)          (genuine_Xd.pkl)  SerpApi,
                                               ZenRows)
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI component framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | v4 | Utility-first responsive styling |
| Recharts | Latest | Revenue and demand data visualization |
| Axios | Latest | HTTP client with JWT request interceptor |
| Lucide React | Latest | Consistent icon set |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11 | Core language |
| FastAPI | 0.111.0 | Async REST API framework |
| Uvicorn | 0.30.1 | ASGI production server |
| SQLAlchemy | 2.0.30 | ORM and connection pool management |
| Alembic | 1.13.1 | Database migration engine |
| Pydantic | v2.7.3 | Request/response schema validation |
| python-jose | 3.3.0 | JWT signing and verification (HS256) |
| passlib[bcrypt] | 1.7.4 | Secure password hashing |
| XGBoost | ≥1.7.0 | Price optimization regression model |
| Scikit-learn | Latest | Preprocessing pipeline and ML utilities |
| Pandas / NumPy | Latest | Data wrangling and feature engineering |
| joblib | Latest | Model serialization and loading |

### Infrastructure & External Services

| Service | Role |
|--------|------|
| PostgreSQL 16 | Primary relational data store |
| psycopg2-binary | Python PostgreSQL adapter |
| RapidAPI — Amazon | Live Amazon India competitor prices |
| RapidAPI — Flipkart | Live Flipkart competitor prices |
| SerpApi | Google Shopping price intelligence |
| ZenRows / ScrapingDog | Web scraping fallback layer |

---

## Project Structure

```
PricePilot_AI/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Public landing page
│   │   │   ├── Login.jsx                # JWT authentication
│   │   │   ├── Register.jsx             # Account creation
│   │   │   ├── Dashboard.jsx            # Executive KPI overview
│   │   │   ├── Products.jsx             # Catalog management (CRUD)
│   │   │   ├── PricePrediction.jsx      # AI price recommendation interface
│   │   │   ├── Forecasts.jsx            # Demand forecasting dashboard
│   │   │   ├── RevenueOptimization.jsx  # Batch recommendation grid
│   │   │   ├── Analytics.jsx            # Revenue & margin analytics
│   │   │   ├── ExecutiveBi.jsx          # Executive BI report
│   │   │   ├── Competitors.jsx          # Live competitor intelligence
│   │   │   ├── AmazonApiTest.jsx        # Amazon API test interface
│   │   │   └── FlipkartApiTest.jsx      # Flipkart API test interface
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   └── DemandForecastChart.jsx
│   │   │   └── prediction/
│   │   │       ├── PredictionForm.jsx
│   │   │       ├── PredictionResultCard.jsx
│   │   │       ├── ExplanationCard.jsx
│   │   │       ├── RecommendationCard.jsx
│   │   │       └── HistoricalSummaryCard.jsx
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx           # Sidebar + header shell (lg: breakpoint)
│   │   ├── services/
│   │   │   └── api.js                   # Axios with Bearer token interceptor
│   │   └── utils/auth.js                # Token storage helpers
│   ├── .env                             # VITE_API_BASE_URL
│   └── vite.config.js
│
├── backend/
│   ├── main.py                          # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   ├── app/
│   │   ├── api/endpoints/
│   │   │   ├── auth.py                  # Login, register, JWT issuance
│   │   │   ├── dashboard.py             # KPI aggregations, revenue charts
│   │   │   ├── products.py              # Full CRUD, CSV upload, price sync
│   │   │   ├── predictions.py           # ML price prediction + demand forecast
│   │   │   ├── analytics.py             # Revenue trend, category margin
│   │   │   ├── competitors.py           # Competitor sync orchestration
│   │   │   ├── historical.py            # Historical data access
│   │   │   ├── amazon.py                # Amazon API proxy
│   │   │   ├── flipkart.py              # Flipkart API proxy
│   │   │   └── users.py                 # User management (admin)
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic Settings (reads .env)
│   │   │   └── security.py              # JWT creation, password hashing
│   │   ├── db/session.py                # SQLAlchemy engine + get_db dependency
│   │   ├── models/                      # ORM table definitions (products, users, etc.)
│   │   ├── schemas/                     # Pydantic request/response models
│   │   ├── services/                    # Business logic (competitor_service, analytics_service)
│   │   └── crud/                        # DB query helpers
│   ├── ml/
│   │   ├── models/
│   │   │   ├── optimal_price_pipeline.pkl          # XGBoost v4 (~2.4 MB)
│   │   │   ├── demand_forecasting/                 # Production CV fold models (20 files)
│   │   │   └── demand_forecasting_dev/             # Runtime inference models
│   │   │       ├── demand_encoder.pkl
│   │   │       ├── genuine_7d.pkl
│   │   │       ├── genuine_14d.pkl
│   │   │       ├── genuine_30d.pkl
│   │   │       └── genuine_90d.pkl
│   │   ├── data/
│   │   │   ├── demand_forecasting_features.csv     # 828 products, weekly records
│   │   │   └── retail_price_optimization_dataset_improved.csv
│   │   ├── predictor.py               # XGBoost inference singleton (hot-reload capable)
│   │   ├── demand_predictor.py        # Demand forecasting inference + seasonal analysis
│   │   ├── recommendation.py          # 12-factor business recommendation engine
│   │   ├── config.py                  # MODEL_PATH, FEATURE_COLUMNS, DEFAULT_VALUES
│   │   ├── calendar_config.py         # Verified Indian holiday calendar
│   │   ├── training/                  # Training scripts (train_xgboost.py, train_demand_dev.py, etc.)
│   │   └── evaluation/                # Audit scripts and benchmark results
│   │       ├── evaluate_price_model.py
│   │       ├── evaluate_demand_model.py
│   │       ├── validate_recommendations.py
│   │       ├── benchmark_api.py
│   │       └── *.json                 # Saved evaluation results
│   ├── alembic/                       # DB migration versions
│   ├── alembic.ini
│   └── Dockerfile
│
├── docs/
│   └── deployment-readiness.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Datasets

### `retail_price_optimization_dataset_improved.csv`
Training data for the XGBoost price model. Each row represents a product snapshot containing:

- Product identifiers: `product_id`, `product_name`, `brand`, `category`
- Pricing fields: `base_price`, `cost_price`, `current_price`
- Market signals: `competitor_price`, `demand_index`, `inventory_level`
- Promotion metadata: `promotion_type`, `season`
- Business metrics: `historical_sales`, `average_rating`, `review_count`, `profit_margin`
- Product identity: `supplier_name`, `product_lifecycle`, `launch_year`, `days_since_launch`

### `demand_forecasting_features.csv`
Time-series dataset covering 828 products at weekly granularity (~180,000+ rows):

- Temporal: `date`, `year`, `month`, `week`, `quarter`, `day_of_week`, `season`
- Lag features: `units_sold_lag_1`, `units_sold_lag_2`, `units_sold_lag_4`, `units_sold_lag_8`
- Revenue lags: `revenue_lag_1`, `inventory_turnover_lag_1`, `demand_index_lag_1`
- Rolling statistics: `rolling_4w_sales_mean/max/std`, `rolling_8w_sales_mean/max`, `rolling_12w_sales_mean/max`
- Growth: `sales_growth_4w`
- Event flags: `holiday_flag`, `festival_flag`, `holiday_name`, `festival_name`
- Data quality: `is_synthetic` (0 = genuine historical, 1 = simulated fill)

> Training and validation use only rows where `is_synthetic = 0` and `date ≤ 2026-08-10` (verified genuine data boundary).

---

## Feature Engineering

### XGBoost Price Model — 17 Input Features

```python
FEATURE_COLUMNS = [
    'category',           # Product category       → OneHotEncoded
    'brand',              # Brand name             → OneHotEncoded
    'season',             # Current season         → OneHotEncoded
    'base_price',         # Manufacturer price (₹) → Passthrough
    'promotion_type',     # Active promo type      → OneHotEncoded
    'inventory_level',    # Units in stock         → Passthrough
    'demand_index',       # Market demand (0–200)  → Passthrough
    'launch_year',        # First listing year     → Passthrough
    'days_since_launch',  # Product age (days)     → Passthrough
    'product_lifecycle',  # Lifecycle stage        → OneHotEncoded
    'cost_price',         # COGS (₹)               → Passthrough
    'competitor_price',   # Competitor price (₹)   → Passthrough
    'average_rating',     # Star rating (1–5)      → Passthrough
    'review_count',       # Published reviews      → Passthrough
    'historical_sales',   # 30-day units sold      → Passthrough
    'profit_margin',      # Target margin (%)      → Passthrough
    'supplier_name'       # Supplier name          → OneHotEncoded
]
```

### Demand Forecasting — 41 Input Features
Time-series lag features, rolling statistics (4/8/12-week), sales growth metrics, calendar indicators (month, week, quarter, day_of_week, season, holiday_flag, festival_flag), product attributes (brand, category, lifecycle, ratings), and pricing fields (base_price, cost_price, current_price, discount_pct, promo_active_share).

---

## Price Optimization Model

### Architecture

```
Input: 17-feature dict (one row per prediction)
        │
        ▼
ColumnTransformer (Preprocessor)
├── OneHotEncoder  →  [category, brand, season, promotion_type, supplier_name]
└── Passthrough    →  [base_price, inventory_level, demand_index, ...]
        │
        ▼
XGBRegressor
(Target: price_multiplier = optimal_price / current_price)
        │
        ▼
predicted_price = predicted_multiplier × current_price
        │
        ▼
Post-Processing Rules
├── Cost Floor Check:  if predicted_price < cost × 1.10 → clamp
├── Promo Adjustment:  Festival Offer ×0.95, Flash Sale ×0.92, Clearance ×0.90 ...
└── Re-apply floor after promo adjustment
        │
        ▼
Prediction Stability Score (50–100%)
computed from XGBoost per-tree variance across boosted ensemble
```

### Training Methodology

- **Split**: 80% training / 20% test, strictly chronological (no random shuffle)
- **Target**: Price multiplier (ratio of optimal to current price)
- **Serialization**: Full pipeline (preprocessor + model) saved as `optimal_price_pipeline.pkl` via joblib
- **Hot-reload**: `predictor.py` detects file modification time (mtime) and reloads without server restart

---

## Demand Forecasting Engine

### Models

| Horizon | Model File | Validation | Training Folds |
|---------|-----------|------------|---------------|
| 7-day | `genuine_7d.pkl` | ✅ Production Ready | 4 |
| 14-day | `genuine_14d.pkl` | ✅ Production Ready | 4 |
| 30-day | `genuine_30d.pkl` | ✅ Validated | 4 |
| 90-day | `genuine_90d.pkl` | ⚠️ Limited | 3 |
| 180-day | `target_180d_Fold_3.pkl` | 🔬 Experimental | N/A |
| 365-day | `target_365d_Fold_2.pkl` | ❌ Unverified | N/A |

### Inference Pipeline

```
product_id + horizon
        │
        ▼
Load genuine historical rows (date ≤ 2026-08-10, is_synthetic=0)
        │
        ▼
Extract latest observation row
        │
        ▼
Encode categoricals using demand_encoder.pkl (fitted OrdinalEncoder)
        │
        ▼
Build 41-feature input matrix
        │
        ▼
genuine_Xd.pkl → raw_prediction (units)
        │
        ▼
Trend calculation vs. rolling_4w_sales_mean
(Increasing > +5% | Decreasing < -5% | Stable)
        │
        ▼
Seasonal analysis (genuine records only)
Holiday impact analysis (VERIFIED_CALENDAR)
Confidence score from R² + sMAPE
        │
        ▼
Return: predicted_demand, trend, seasonal_analysis,
        holiday_insights, upcoming_events, confidence_score
```

---

## Business Recommendation Engine

After the XGBoost prediction, `recommendation.py` evaluates **12 business signals** and classifies each as Increasing (→ raise price), Reducing (→ lower price), or Neutral (→ hold price).

| Factor | Increasing Signal | Reducing Signal |
|--------|------------------|-----------------|
| Demand Index | ≥ 80 (High Demand) | ≤ 40 (Low Demand) |
| Inventory Level | Low stock (< 30 units) | Overstocked |
| Competitor Price | Our price below market | Our price above market |
| Promotion Type | No active promotion | Active sale/discount |
| Customer Rating | ≥ 4.5 stars | ≤ 3.0 stars |
| Product Lifecycle | Growth stage | Decline stage |
| Brand Strength | Premium brand detected | Generic / unknown brand |
| Sales Velocity | High 30-day sales | Low 30-day sales |
| Base vs Current Price | Currently discounted | At full base price |
| Cost Floor Risk | Large cost headroom | Near cost floor |
| Margin Analysis | Current margin above target | Below target margin |
| Revenue Impact | Positive projected gain | Negative projected gain |

**Final output:**
- `recommendation`: "Increase Price" / "Decrease Price" / "Maintain Current Price"
- `factors_increasing` / `factors_reducing` / `neutral_factors`: list of named factor objects
- `expected_revenue`: projected at recommended price × inventory
- `current_revenue`: current price × inventory
- `revenue_gain`: delta in ₹

---

## Competitor Intelligence

### Data Sources

| Source | Platform | Data Points |
|--------|---------|------------|
| RapidAPI `real-time-amazon-data` | Amazon India | Price, ASIN, rating, availability |
| RapidAPI `flipkart-apis` | Flipkart | Price, FSN, rating, availability |
| SerpApi | Google Shopping | Organic competitor prices |
| ZenRows / ScrapingDog | Web scraping | Fallback price extraction |

### Sync Logic
- A configurable cooldown (`COMPETITOR_SYNC_COOLDOWN_SECONDS`, default 60s) prevents API quota exhaustion
- Results are stored in PostgreSQL and served from cache until next sync
- The Competitors dashboard calculates: Our Price vs. Amazon, Our Price vs. Flipkart, Market Average, Market Position

---

## REST API

All endpoints are prefixed `/api/v1` and require `Authorization: Bearer <token>` except auth routes.

**Authentication**

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account (name, email, password, role) |
| POST | `/auth/login` | Returns JWT access token (1440-minute expiry) |

**Dashboard**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard/kpis` | Total revenue, ASP, product count, avg demand |
| GET | `/dashboard/revenue-by-category` | Category revenue bar chart data |
| GET | `/dashboard/inventory-overview` | Stockout / Low / Medium / High counts |
| GET | `/dashboard/top-products` | Top 5 products by revenue |
| GET | `/dashboard/revenue-optimization` | Batch price recommendations (828 products) |

**Products**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/products` | Paginated catalog (search, sort, filter) |
| POST | `/products` | Create product |
| PUT | `/products/{id}` | Update product fields |
| DELETE | `/products/{id}` | Remove product |

**Machine Learning**

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/predictions/price` | XGBoost price prediction + recommendation |
| POST | `/predictions/demand` | Demand forecast for product + horizon |

**Analytics**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/analytics/revenue-trend` | Weekly revenue trend (last N weeks) |
| GET | `/analytics/category-margin` | Gross margin by category |

**Competitor Sync**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/competitors/sync/{product_id}` | Trigger live sync |
| GET | `/competitors/status/{product_id}` | Return last cached sync result |
| GET | `/amazon/search` | Amazon product search proxy |
| GET | `/flipkart/search` | Flipkart product search proxy |

Interactive docs: `http://127.0.0.1:8000/docs`

---

## Frontend Dashboard

| Page | Key Features |
|------|-------------|
| **Landing** | Public marketing, feature grid, CTA buttons; fully responsive |
| **Login / Register** | JWT auth flow; role-based post-login redirect |
| **Dashboard** | Revenue KPI cards, trend line chart, inventory donut, top-5 products table |
| **Products** | Search + sort + paginate; add/edit/delete; CSV upload support |
| **Price Prediction** | Existing or new product mode; 17-feature form; XGBoost result card with 12-factor analysis table and stability gauge |
| **Demand Forecasts** | Product selector; horizon tabs (7d/14d/30d/90d); demand chart; seasonal breakdown; holiday event timeline |
| **Revenue Optimization** | All 828 products scored and sorted by projected revenue gain; one-click view per product |
| **Analytics** | Revenue by category chart; margin analysis; lifecycle distribution |
| **Competitors** | Per-product Amazon/Flipkart live prices; sync trigger; market position badge |
| **Executive BI** | Category profit bridge; printable margin table; section headers |

All pages are fully responsive from 320px (mobile) to 1440px+ (desktop) using `sm:`, `md:`, `lg:` Tailwind breakpoints. The sidebar switches to a hamburger-menu overlay below `lg:` (1024px).

---

## End-to-End Data Flow

```
User selects product in Price Prediction page
    ↓
POST /api/v1/predictions/price  {product_id, feature_overrides}
    ↓
JWT verified → product fetched from PostgreSQL
    ↓
17-feature dict constructed (DB values + user overrides + defaults)
    ↓
predictor.py singleton → XGBoost pipeline → predicted_multiplier
    ↓
predicted_price = multiplier × current_price
    ↓
Cost floor check → promotion adjustment → re-apply floor
    ↓
Prediction stability computed from XGBoost tree variance
    ↓
RecommendationEngine.generate_recommendation()
    ↓
12 factors evaluated → classified → revenue impact calculated
    ↓
Response: {predicted_price, recommendation, factors, revenue_gain, stability}
    ↓
React renders: Price card · Factor table · Stability gauge · Revenue delta
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 16 (running locally)

### 1. Clone the Repository
```bash
git clone https://github.com/KMohammedsadiq/Dynamic-Pricing-Optimization-and-Revenue-Intelligence-Platform-K_Mohammad_Sadik.git
cd Dynamic-Pricing-Optimization-and-Revenue-Intelligence-Platform-K_Mohammad_Sadik
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv ../venv

# Windows
..\venv\Scripts\Activate.ps1
# macOS / Linux
source ../venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# First-time database setup
alembic upgrade head
python sync_db_with_dataset.py
python populate_marketplace_metadata.py

# Start the API server
uvicorn main:app --reload
```

**Backend available at:** `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Frontend available at:** `http://localhost:5173`

### 4. Production Build (Frontend)
```bash
cd frontend
npm run build        # Output to dist/
```

---

## Environment Configuration

### `backend/.env`
```env
# Database
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/pricepilot_ai

# Application
ENVIRONMENT=development
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# RapidAPI — Competitor Sync
RAPID_API_KEY=<your-rapidapi-key>
AMAZON_API_HOST=real-time-amazon-data.p.rapidapi.com
FLIPKART_API_HOST=flipkart-apis.p.rapidapi.com
COMPETITOR_SYNC_COOLDOWN_SECONDS=60

# Google Shopping
SERPAPI_API_KEY=<your-serpapi-key>

# Scraping Fallbacks (optional)
ZENROWS_API_KEY=<your-zenrows-key>
SCRAPINGDOG_API_KEY=<your-scrapingdog-key>
```

### `frontend/.env`
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

> Copy `.env.example` as a starting point. **Never commit `.env` to version control.**

---

## ML Validation Results

### Price Optimization — XGBoost v4

| Metric | Result |
|--------|--------|
| Model | XGBoost Pipeline v4.0-XGB-Improved |
| Training methodology | 80/20 chronological split |
| Test rows | ~16,000 (most recent period) |
| Mean Absolute Error (MAE) | ₹18.42 |
| Root Mean Squared Error (RMSE) | ₹28.17 |
| R² | 0.985 |

### Demand Forecasting — Genuine Historical Holdout (Jun–Aug 2026)

| Horizon | R² | MAE (units) | RMSE (units) | sMAPE | Confidence Score |
|---------|-----|-------------|--------------|-------|-----------------|
| 7-day | 0.774 | 54.2 | 97.1 | 14.5% | 80/100 |
| 14-day | 0.694 | 119.5 | 203.2 | 17.7% | 76/100 |
| 30-day | 0.532 | 271.9 | 459.8 | 20.7% | 65/100 |
| 90-day | 0.388 | 891.8 | 1421.1 | 19.8% | 59/100 |

> All demand validation metrics are computed exclusively on rows where `is_synthetic = 0` and `date ≤ 2026-08-10`.

### Recommendation Coverage Audit

- 828 products evaluated through the full recommendation pipeline
- 100% received a valid recommendation (no null outputs)
- Recommendation distribution: Increase Price / Decrease Price / Maintain price across all lifecycle stages
- Cost floor enforcement: 0 recommendations below cost × 1.10

---

## Performance Benchmarks

API response time benchmarks from `backend/ml/evaluation/benchmark_api.py` (single-process local environment):

| Endpoint | Avg Response Time | Notes |
|---------|------------------|-------|
| `GET /dashboard/kpis` | < 200ms | Aggregation query |
| `POST /predictions/price` | < 150ms | Singleton model, no DB join |
| `POST /predictions/demand` | < 300ms | Dataset lookup + model inference |
| `GET /dashboard/revenue-optimization` | ~800ms | Batch 828 products |

> Response time increased as concurrency increased in the single-process local development environment. Results should not be generalized to production infrastructure.

---

## Limitations & Known Issues

- **Model reloading**: The XGBoost predictor checks file modification time on every request. For high-traffic production use, model caching with a TTL should be added.
- **Demand data cutoff**: Demand forecasting uses a fixed historical cutoff (`2026-08-10`). Predictions reflect market conditions as of that date.
- **180d / 365d horizons**: Insufficient genuine historical data for validation. Marked Experimental and Unverified in the UI.
- **Competitor sync cooldown**: Rate-limited to protect third-party API quotas. Increase `COMPETITOR_SYNC_COOLDOWN_SECONDS` for production.
- **CORS**: Currently set to `allow_origins=["*"]`. Must be restricted to the deployed frontend domain before production.
- **Debug mode**: `debug=True` is set in `main.py`. Must be disabled in production to prevent stack trace exposure.
- **CSV-based demand data**: The demand dataset is a flat CSV file at startup. A proper database-backed solution should replace this for production.

---

## Security Checklist

| Item | Status |
|------|--------|
| JWT authentication (HS256) | ✅ Implemented |
| bcrypt password hashing | ✅ Implemented |
| Role-based access control | ✅ Implemented (Admin / Pricing Manager / Business Analyst) |
| Environment variable configuration | ✅ via Pydantic BaseSettings |
| CORS restriction | ⚠️ Open (`*`) — must be locked down for production |
| Debug mode | ⚠️ `debug=True` — must be set to `False` in production |
| Secret key rotation | ⚠️ Use a secrets manager (not `.env`) in production |
| API key exposure | ⚠️ All keys in `.env` — use platform environment variables in production |
| SQL injection | ✅ Protected by SQLAlchemy ORM parameterisation |
| `.env` committed to repo | ❌ Must never be committed — add to `.gitignore` |

---

*K. Mohammad Sadik — Dynamic Pricing Optimization and Revenue Intelligence Internship Project*
