# 💰 PricePilot AI
### Dynamic Pricing Optimization & Revenue Intelligence Platform for Indian Retail

> Historical sales data → ML price prediction → demand forecasting → elasticity-aware revenue optimization → live competitor intelligence → explainable business recommendations — all in one enterprise dashboard.

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi) ![XGBoost](https://img.shields.io/badge/XGBoost-≥1.7-orange) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss) ![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)

---

## 📌 The Core Question

> **What price should we set for this product right now, and why?**

PricePilot AI answers this by combining an **XGBoost price optimization pipeline**, **multi-horizon demand forecasting**, **real-time competitor intelligence**, and a **human-readable business recommendation engine** into a single, explainable platform localized for Indian Rupee (₹) retail.

---

## 📑 Table of Contents

1. [What the System Does](#-what-the-system-does)
2. [High-Level Architecture](#-high-level-architecture)
3. [Technology Stack](#-technology-stack)
4. [Project Structure](#-project-structure)
5. [Dataset Description](#-dataset-description)
6. [Feature Engineering](#-feature-engineering)
7. [Machine Learning Workflow](#-machine-learning-workflow)
8. [Demand Forecasting Module](#-demand-forecasting-module)
9. [Business Recommendation Engine](#-business-recommendation-engine)
10. [Competitor Intelligence](#-competitor-intelligence)
11. [Backend API](#-backend-api)
12. [Frontend Modules](#-frontend-modules)
13. [Complete Request Flow](#-complete-request-flow)
14. [Installation](#-installation)
15. [Environment Variables](#-environment-variables)
16. [Running the Project](#-running-the-project)
17. [ML Model Validation Results](#-ml-model-validation-results)
18. [Security Notes](#-security-notes)
19. [Summary](#-summary)

---

## 🚀 What the System Does

For any product in the catalog, PricePilot AI:

| Step | Action |
|------|--------|
| 1 | Loads product and historical sales records from PostgreSQL |
| 2 | Constructs a 17-feature input vector (pricing, inventory, market, lifecycle, promo) |
| 3 | Runs the XGBoost v4 pipeline to predict the optimal price multiplier |
| 4 | Enforces a hard cost floor (cost × 1.10) to guarantee profitability |
| 5 | Applies promotion-type multiplier adjustments for known promotional events |
| 6 | Runs multi-horizon demand forecasting (7 / 14 / 30 / 90-day horizons) |
| 7 | Analyses 12 business factors (demand, inventory, competition, lifecycle, etc.) |
| 8 | Generates a categorized recommendation: Increase / Decrease / Maintain |
| 9 | Syncs live competitor prices from Amazon and Flipkart via RapidAPI |
| 10 | Presents all results through a responsive, dark-mode enterprise dashboard |

---

## 🏗️ High-Level Architecture

```
PostgreSQL Database
        │
        ▼
  Product + Historical Data Loading
        │
        ▼
  17-Feature Engineering
        │
        ▼
  XGBoost v4 Optimal Price Pipeline
        │
        ▼
  Business Rules Layer
  (Cost Floor · Promo Adjustment · Prediction Stability)
        │
        ├──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼
  Demand Forecasting     Competitor Sync         Revenue Optimization
  (7d / 14d / 30d / 90d) (Amazon / Flipkart)     (Batch Recommendations)
        │                      │                      │
        └──────────┬───────────┘                      │
                   ▼                                   │
        Business Recommendation Engine ←──────────────┘
                   │
                   ▼
          React + Tailwind Dashboard
          (Dark Mode · Mobile Responsive)
```

---

## 🧰 Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 8 | Build tool and dev server |
| Tailwind CSS v4 | Utility-first dark-mode styling |
| Recharts | Interactive revenue and demand charts |
| Lucide React | Icon set |
| Axios | HTTP client with JWT interceptor |

### Backend

| Technology | Purpose |
|-----------|---------|
| Python 3.11 | Core language |
| FastAPI 0.111 | High-performance async API framework |
| Uvicorn | ASGI server |
| SQLAlchemy 2.0 | ORM and database session management |
| Alembic 1.13 | Database migrations |
| Pydantic v2 | Request/response validation |
| XGBoost ≥ 1.7 | Price optimization model |
| Scikit-learn | ML preprocessing pipeline |
| Pandas / NumPy | Data processing and feature engineering |
| python-jose | JWT token generation and validation |
| passlib[bcrypt] | Secure password hashing |
| joblib | Model serialization |
| requests | External API calls |

### Database & ML Storage

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary data store |
| psycopg2-binary | PostgreSQL adapter |
| .pkl (joblib) | Serialized ML model artifacts |

### External Services

| Service | Role |
|--------|------|
| RapidAPI — Amazon | Live Amazon competitor price sync |
| RapidAPI — Flipkart | Live Flipkart competitor price sync |
| SerpApi | Google Shopping competitor price research |
| ZenRows / ScrapingDog | Web scraping fallbacks for competitor data |

---

## 📁 Project Structure

```
PricePilot_AI/
│
├── frontend/                          # Presentation Layer (React + Vite)
│   ├── src/
│   │   ├── pages/                     # Full-page route views
│   │   │   ├── Landing.jsx            # Public landing page
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── Dashboard.jsx          # Executive KPI overview
│   │   │   ├── Products.jsx           # Product catalog & management
│   │   │   ├── PricePrediction.jsx    # AI price prediction interface
│   │   │   ├── Analytics.jsx          # Revenue & category analytics
│   │   │   ├── Forecasts.jsx          # Demand forecasting dashboard
│   │   │   ├── RevenueOptimization.jsx# Batch revenue recommendations
│   │   │   ├── ExecutiveBi.jsx        # Executive BI report
│   │   │   ├── Competitors.jsx        # Live competitor price intelligence
│   │   │   └── AmazonApiTest.jsx / FlipkartApiTest.jsx
│   │   ├── components/
│   │   │   ├── charts/                # Recharts visualization components
│   │   │   └── prediction/            # Prediction form & result cards
│   │   ├── layouts/MainLayout.jsx     # Sidebar + header shell
│   │   ├── services/api.js            # Axios instance with JWT interceptor
│   │   └── utils/auth.js             # Token helpers
│   ├── .env                           # VITE_API_BASE_URL
│   └── vite.config.js
│
├── backend/                           # Application Logic Layer (FastAPI)
│   ├── app/
│   │   ├── api/endpoints/             # Route handlers
│   │   │   ├── auth.py                # Login / register / JWT
│   │   │   ├── dashboard.py           # KPIs, revenue, inventory summaries
│   │   │   ├── products.py            # CRUD for product catalog
│   │   │   ├── predictions.py         # ML price prediction API
│   │   │   ├── analytics.py           # Revenue & margin analytics
│   │   │   ├── competitors.py         # Competitor sync orchestration
│   │   │   ├── historical.py          # Historical data access
│   │   │   ├── amazon.py / flipkart.py# Marketplace API proxies
│   │   │   └── users.py               # User management (RBAC)
│   │   ├── core/config.py             # Pydantic settings (reads .env)
│   │   ├── db/session.py              # SQLAlchemy engine & session
│   │   ├── models/                    # ORM table definitions
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── services/                  # Business logic layer
│   │   └── crud/                      # Database CRUD operations
│   ├── ml/
│   │   ├── models/
│   │   │   ├── optimal_price_pipeline.pkl       # XGBoost v4 (~2.4 MB)
│   │   │   ├── demand_forecasting/              # Production fold models
│   │   │   │   └── target_Xd_FoldY.pkl          # 20 fold models
│   │   │   └── demand_forecasting_dev/          # Validated inference models
│   │   │       ├── demand_encoder.pkl
│   │   │       ├── genuine_7d.pkl
│   │   │       ├── genuine_14d.pkl
│   │   │       ├── genuine_30d.pkl
│   │   │       └── genuine_90d.pkl
│   │   ├── data/
│   │   │   ├── demand_forecasting_features.csv  # 828-product runtime dataset
│   │   │   └── retail_price_optimization_dataset_improved.csv
│   │   ├── predictor.py               # XGBoost inference singleton
│   │   ├── demand_predictor.py        # Demand forecasting inference
│   │   ├── recommendation.py          # Business recommendation engine
│   │   ├── config.py                  # ML paths and feature definitions
│   │   ├── training/                  # All training scripts
│   │   └── evaluation/                # Validation & benchmarking scripts
│   ├── alembic/                       # Database migrations
│   ├── main.py                        # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                           # Runtime secrets
│
├── docs/
│   └── deployment-readiness.md
├── docker-compose.yml
└── README.md
```

---

## 🗂️ Dataset Description

### `retail_price_optimization_dataset_improved.csv`
The primary training dataset for the XGBoost price model, containing retail product records with fields:

- Product ID, name, brand, category
- Base price, cost price, current price
- Competitor price, inventory level, demand index
- Promotion type, supplier name
- Product lifecycle stage, launch year, days since launch
- Average rating, review count, historical sales
- Profit margin, season

### `demand_forecasting_features.csv`
~828 products × weekly time-series records (~180,000+ rows) used for demand forecasting:

- `product_id`, `date`, `units_sold`
- Lag features: `units_sold_lag_1/2/4/8`, `revenue_lag_1`, `inventory_turnover_lag_1`
- Rolling statistics: `rolling_4w/8w/12w_sales_mean/max/std`
- Sales growth, demand index lags, stockout flags
- Temporal features: `year`, `month`, `week`, `quarter`, `day_of_week`, `season`
- `holiday_flag`, `festival_flag`, `days_since_first_observed`
- Data quality flag: `is_synthetic` (0 = genuine historical, 1 = simulated)

> 💡 The catalog data represents the current business state; the historical dataset captures past demand behaviour across time.

---

## ⚙️ Feature Engineering

The XGBoost price model uses **17 features** in this exact order:

```python
FEATURE_COLUMNS = [
    'category',          # Product category (OHE)
    'brand',             # Brand name (OHE)
    'season',            # Current season (OHE)
    'base_price',        # Manufacturer list price (₹)
    'promotion_type',    # Active promo type (OHE)
    'inventory_level',   # Units in stock
    'demand_index',      # Market demand score (0–200)
    'launch_year',       # Year the product was first listed
    'days_since_launch', # Product age in days
    'product_lifecycle', # Introduction / Growth / Maturity / Decline
    'cost_price',        # Cost of goods sold (₹)
    'competitor_price',  # Competitor's current price (₹)
    'average_rating',    # Customer star rating (1–5)
    'review_count',      # Number of published reviews
    'historical_sales',  # 30-day historical units sold
    'profit_margin',     # Target profit margin (%)
    'supplier_name'      # Supplier identifier (OHE)
]
```

Demand forecasting uses **41 additional time-series features** including lag values, rolling statistics, and calendar indicators.

---

## 🤖 Machine Learning Workflow

### Price Optimization Model

The production model is an **XGBoost Regression Pipeline v4.0** (`optimal_price_pipeline.pkl`) trained using a strict 80/20 chronological split.

```
Training Data (80%)    │    Test Data (20%)
─────────────────────────────────────────────
Historical rows 1–N    │    Most recent rows
```

**Pipeline Components:**

```
ColumnTransformer (Preprocessor)
├── OneHotEncoder → [category, brand, season, promotion_type, supplier_name]
└── PassThrough   → [base_price, inventory_level, demand_index, ...]
            │
            ▼
     XGBRegressor
     (Target: optimal_price_multiplier)
```

**Post-Processing Business Rules:**

| Rule | Description |
|------|-------------|
| Hard Cost Floor | `predicted_price < cost × 1.10` → clamp to floor |
| Promotion Adjustment | Festival Offer → ×0.95, Flash Sale → ×0.92, Clearance → ×0.90, etc. |
| Prediction Stability | XGBoost tree-variance score (50–100%) |

**Validation Results:**

| Metric | Value |
|--------|-------|
| MAE | ₹18.42 |
| RMSE | ₹28.17 |
| R² | 0.985 |
| Test rows | ~16,000 |

---

## 📈 Demand Forecasting Module

The demand forecasting engine predicts future units sold across **4 validated horizons**:

| Horizon | Model File | Validation Status | R² | sMAPE |
|---------|-----------|-------------------|----|-------|
| 7 days | `genuine_7d.pkl` | ✅ Production Ready | 0.774 | 14.5% |
| 14 days | `genuine_14d.pkl` | ✅ Production Ready | 0.694 | 17.7% |
| 30 days | `genuine_30d.pkl` | ✅ Validated | 0.532 | 20.7% |
| 90 days | `genuine_90d.pkl` | ⚠️ Limited | 0.388 | 19.8% |

**Methodology:**
- Models trained using **Time-Series Cross-Validation** (expanding window, 3–4 folds)
- Evaluated on **genuine historical records only** using a chronological holdout (Jun–Aug 2026)
- A fixed genuine data cutoff (`2026-08-10`) prevents simulation data leakage
- A separately fitted `demand_encoder.pkl` ensures consistent categorical encodings between training and inference

**Output per product:**
- Predicted demand units for the selected horizon
- Demand trend (Increasing / Stable / Decreasing)
- Confidence score and confidence level
- Seasonal analysis by season (genuine vs. synthetic data quality)
- Holiday impact insights (Diwali, Holi, New Year, Independence Day, etc.)
- Upcoming festival/holiday events within the forecast window

---

## 💡 Business Recommendation Engine

Implemented in `backend/ml/recommendation.py`, the engine evaluates **12 business factors** after the XGBoost prediction to produce an explainable recommendation:

```
Predicted Price vs. Current Price
        │
        ▼
  ΔChange > +5%  →  "Increase Price"
  ΔChange < -5%  →  "Decrease Price"
  Otherwise      →  "Maintain Current Price"
```

**The 12 Analysed Business Factors:**

| Factor | Signal |
|--------|--------|
| Demand Index | High demand (≥80) → price increase pressure |
| Inventory Level | Low stock → reduce discount pressure |
| Competitor Price | Below market → room to increase |
| Promotion Type | Active promo → reduce price recommendation |
| Customer Rating | High rating → premium pricing supported |
| Product Lifecycle | Decline stage → clearance pricing |
| Brand Strength | Premium brand → premium price defensible |
| Historical Sales Velocity | High velocity → demand confirmed |
| Base vs. Current Price | Discount depth signal |
| Cost Price | Margin protection signal |
| Margin Analysis | Current vs. target margin gap |
| Revenue Impact Projection | Expected gain/loss at recommended price |

Each factor is classified as **Increasing**, **Reducing**, or **Neutral** — displayed as color-coded badges in the dashboard.

---

## 🔎 Competitor Intelligence

Implemented in `backend/app/services/competitor_service.py` and `backend/competitor_scraper/`.

**Live Data Sources:**

| Source | Platform | Data Fetched |
|--------|---------|-------------|
| RapidAPI (real-time-amazon-data) | Amazon India | Live product price, ASIN, rating |
| RapidAPI (flipkart-apis) | Flipkart | Live product price, FSN, rating |
| SerpApi | Google Shopping | Organic competitor prices |
| ZenRows / ScrapingDog | Web scraping fallback | Competitor page prices |

**Sync Logic:**
- A configurable cooldown (`COMPETITOR_SYNC_COOLDOWN_SECONDS`) prevents API quota abuse
- Results are stored per product in the PostgreSQL database
- The dashboard shows market position: **Lowest / Competitive / Premium**
- Price gap calculations for Amazon and Flipkart are displayed on the Competitors page

---

## 🔌 Backend API

**Base URL:** `http://127.0.0.1:8000/api/v1`

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/` | Health check |
| POST | `/auth/login` | JWT login |
| POST | `/auth/register` | User registration |
| GET | `/dashboard/kpis` | Revenue, ASP, demand KPIs |
| GET | `/dashboard/revenue-by-category` | Category revenue breakdown |
| GET | `/dashboard/inventory-overview` | Stockout / low / medium / high counts |
| GET | `/dashboard/top-products` | Top products by revenue |
| GET | `/products` | Full product catalog (paginated) |
| POST | `/products` | Create new product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| POST | `/predictions/price` | XGBoost price prediction + recommendation |
| POST | `/predictions/demand` | Demand forecast for product + horizon |
| GET | `/analytics/revenue-trend` | Weekly/monthly revenue trend |
| GET | `/analytics/category-margin` | Gross margin by category |
| GET | `/competitors/sync/{product_id}` | Trigger live competitor price sync |
| GET | `/competitors/status/{product_id}` | Last sync result for product |
| GET | `/amazon/search` | Amazon product search proxy |
| GET | `/flipkart/search` | Flipkart product search proxy |
| GET | `/users` | User list (admin only) |

---

## 🖥️ Frontend Modules

| Module | Description |
|--------|-------------|
| **Landing Page** | Public marketing page with feature highlights |
| **Login / Register** | JWT authentication with role-based redirect |
| **Dashboard** | Executive KPI cards, revenue trend chart, inventory donut, top-5 products |
| **Products** | Full catalog table with search, sort, pagination, add/edit/delete |
| **Price Prediction** | XGBoost prediction form (existing & new products), 12-factor analysis table, confidence score |
| **Demand Forecasts** | Horizon selector, demand trend chart, seasonal analysis, holiday impact |
| **Revenue Optimization** | Batch recommendation grid sorted by revenue impact |
| **Analytics** | Revenue by category, margin trends, product lifecycle breakdown |
| **Competitor Intelligence** | Per-product Amazon / Flipkart price comparison, sync trigger |
| **Executive BI** | Margin bridge, category profitability table, print-ready layout |

All pages are **fully responsive** across mobile (320px) to desktop (1440px+) using Tailwind CSS breakpoints (`sm:`, `md:`, `lg:`).

---

## 🔄 Complete Single-Product Prediction Request Flow

```
 1. User selects a product in the React interface.
 2. Frontend calls POST /api/v1/predictions/price.
 3. FastAPI authenticates JWT and validates the request.
 4. Product record is loaded from PostgreSQL.
 5. 17-feature dictionary is constructed.
 6. XGBoost pipeline singleton (predictor.py) runs inference.
 7. Predicted price multiplier × current_price → predicted_price.
 8. Hard cost floor check is applied (cost × 1.10).
 9. Promotion-type adjustment is applied if applicable.
10. Prediction stability score is computed from XGBoost tree variance.
11. RecommendationEngine analyses 12 business factors.
12. Action is classified: Increase / Decrease / Maintain.
13. Revenue impact is projected against current inventory.
14. FastAPI returns the complete prediction + recommendation payload.
15. React renders the price card, factor table, stability gauge, and revenue delta.
```

---

## 🛠️ Installation

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+**
- **PostgreSQL 16** running locally

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

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 🔑 Environment Variables

### Backend — `backend/.env`
```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/pricepilot_ai

# Application
ENVIRONMENT=development
SECRET_KEY=<your-random-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# RapidAPI (Amazon & Flipkart)
RAPID_API_KEY=<your-rapidapi-key>
AMAZON_API_HOST=real-time-amazon-data.p.rapidapi.com
FLIPKART_API_HOST=flipkart-apis.p.rapidapi.com
COMPETITOR_SYNC_COOLDOWN_SECONDS=60

# SerpApi
SERPAPI_API_KEY=<your-serpapi-key>

# ZenRows / ScrapingDog (optional scraping fallbacks)
ZENROWS_API_KEY=<your-zenrows-key>
SCRAPINGDOG_API_KEY=<your-scrapingdog-key>
```

### Frontend — `frontend/.env`
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

> ⚠️ **Never commit `.env` to version control.** Use `.env.example` when sharing.

---

## ▶️ Running the Project

### Start the Backend
```bash
cd backend
uvicorn main:app --reload
```
Available at: `http://127.0.0.1:8000`
API docs: `http://127.0.0.1:8000/docs`

### Start the Frontend
```bash
cd frontend
npm run dev
```
Available at: `http://localhost:5173`

### Database Initialization (First Time Only)
```bash
cd backend

# Run Alembic migrations
alembic upgrade head

# Seed product and sales data
python sync_db_with_dataset.py
python populate_marketplace_metadata.py
```

---

## 📊 ML Model Validation Results

### Price Prediction (XGBoost v4)

| Metric | Value |
|--------|-------|
| Model | XGBoost Pipeline v4.0-XGB-Improved |
| Training split | 80/20 chronological |
| MAE | ₹18.42 |
| RMSE | ₹28.17 |
| R² | 0.985 |

### Demand Forecasting (Genuine Historical Holdout)

| Horizon | R² | MAE (units) | RMSE (units) | sMAPE |
|---------|-----|-------------|--------------|-------|
| 7-day | 0.774 | 54.2 | 97.1 | 14.5% |
| 14-day | 0.694 | 119.5 | 203.2 | 17.7% |
| 30-day | 0.532 | 271.9 | 459.8 | 20.7% |
| 90-day | 0.388 | 891.8 | 1421.1 | 19.8% |

> All demand metrics are evaluated on **genuine historical records only** using a chronological holdout (June–August 2026). Synthetic/simulated data rows are excluded from validation.

---

## 🔒 Security Notes

| Area | Current State |
|------|-------------|
| JWT Authentication | ✅ Implemented (HS256, configurable expiry) |
| Password Hashing | ✅ bcrypt via passlib |
| CORS | ⚠️ Open (`*`) — restrict to frontend domain in production |
| Debug Mode | ⚠️ `debug=True` in `main.py` — must be disabled in production |
| API Keys | ⚠️ In `.env` — must be injected via environment manager in production |
| Database Credentials | ⚠️ In `.env` — use secrets manager in production |

---

## 📖 Summary

PricePilot AI is a complete, production-ready retail pricing decision platform. It combines:

```
  Data Engineering  +  XGBoost Price Optimization  +  Multi-Horizon Demand Forecasting
        +  12-Factor Business Recommendation Engine  +  Live Competitor Intelligence
                +  Responsive Enterprise Dashboard
                 = One Explainable Retail Pricing Platform
```

The system is not a black box — every pricing recommendation is accompanied by quantified business factors, a confidence score, projected revenue impact, and real-time market positioning data, giving pricing managers the context they need to act with confidence.

---

*Built as part of the Dynamic Pricing Optimization and Revenue Intelligence internship project — K. Mohammad Sadik*
