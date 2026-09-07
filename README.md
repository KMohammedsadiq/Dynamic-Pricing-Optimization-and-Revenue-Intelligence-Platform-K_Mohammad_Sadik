# PricePilot AI

**An enterprise-grade dynamic pricing and revenue intelligence platform built for Indian retail.**

PricePilot AI combines machine learning price optimization, multi-horizon demand forecasting, and live competitor intelligence to help pricing managers make confident, data-backed decisions — all through a single responsive dashboard.

---

## Overview

Most businesses set prices based on intuition. PricePilot AI replaces guesswork with a structured ML pipeline that looks at 17 business signals — demand trends, inventory position, competitor prices, customer ratings, lifecycle stage, and more — and returns an explainable price recommendation alongside projected revenue impact.

The platform is localized for the Indian market (₹ INR) and supports product catalogs with hundreds of SKUs across multiple categories.

---

## Core Capabilities

**AI Price Optimization**
An XGBoost regression pipeline predicts the optimal price multiplier for any product. The pipeline enforces a hard cost floor (cost × 1.10) to guarantee profitability and applies promotion-type adjustments for events like Festival Offers, Flash Sales, and Clearance pricing.

**Demand Forecasting**
Separate gradient-boosted models forecast units sold at 7-day, 14-day, 30-day, and 90-day horizons. All models are trained and evaluated on genuine historical records using time-series cross-validation — never on synthetic or simulated data.

**Recommendation Engine**
After the ML output, a 12-factor business rules engine categorizes each signal (demand, inventory, competition, lifecycle, etc.) as Increasing, Reducing, or Neutral pressure on price — giving the pricing manager a clear explanation, not just a number.

**Live Competitor Intelligence**
The system syncs real-time prices from Amazon and Flipkart via RapidAPI and from Google Shopping via SerpApi. Per-product market position (Lowest / Competitive / Premium) is calculated and displayed automatically.

**Revenue Optimization Dashboard**
A batch recommendation engine scores all 828 catalog products simultaneously by projected revenue uplift, surfacing the highest-impact pricing opportunities first.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite 8, Tailwind CSS v4, Recharts, Axios |
| Backend | Python 3.11, FastAPI 0.111, Uvicorn, SQLAlchemy 2.0 |
| Database | PostgreSQL 16, Alembic (migrations) |
| ML / Data | XGBoost ≥1.7, Scikit-learn, Pandas, NumPy, joblib |
| Auth | JWT (python-jose), bcrypt (passlib) |
| External APIs | RapidAPI (Amazon, Flipkart), SerpApi, ZenRows, ScrapingDog |

---

## Repository Layout

```
PricePilot_AI/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/      ← Route handlers (auth, products, predictions, analytics, competitors...)
│   │   ├── core/               ← Pydantic settings, security helpers
│   │   ├── db/                 ← SQLAlchemy engine and session
│   │   ├── models/             ← ORM table definitions
│   │   ├── schemas/            ← Request / response validation
│   │   ├── services/           ← Business logic (competitor sync, analytics aggregation...)
│   │   └── crud/               ← Database CRUD helpers
│   ├── ml/
│   │   ├── models/
│   │   │   ├── optimal_price_pipeline.pkl   ← XGBoost v4 price model (~2.4 MB)
│   │   │   ├── demand_forecasting/          ← Production cross-validation fold models
│   │   │   └── demand_forecasting_dev/      ← Validated runtime inference models
│   │   ├── data/
│   │   │   ├── demand_forecasting_features.csv  ← 828 products × weekly records
│   │   │   └── retail_price_optimization_dataset_improved.csv
│   │   ├── predictor.py          ← XGBoost inference singleton
│   │   ├── demand_predictor.py   ← Demand forecasting inference
│   │   ├── recommendation.py     ← 12-factor business recommendation engine
│   │   ├── config.py             ← Feature definitions and model paths
│   │   ├── training/             ← All model training scripts
│   │   └── evaluation/           ← Validation, benchmarking, and audit scripts
│   ├── alembic/                  ← Database migration files
│   ├── main.py                   ← Application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                ← Full-page views (Dashboard, Products, Forecasts, etc.)
│   │   ├── components/           ← Charts, prediction cards, reusable UI
│   │   ├── layouts/              ← Sidebar and header shell
│   │   └── services/             ← Axios API client with JWT interceptor
│   ├── .env                      ← VITE_API_BASE_URL
│   └── vite.config.js
├── docs/
│   └── deployment-readiness.md
└── docker-compose.yml
```

---

## Machine Learning Details

### Price Optimization (XGBoost v4)

The production model is trained on a 80/20 chronological split of historical product pricing data. It predicts a *price multiplier* (not a raw price), which is then multiplied by the current product price to arrive at the optimal recommended price.

**Input Features (17 total):**

```
category · brand · season · base_price · promotion_type
inventory_level · demand_index · launch_year · days_since_launch
product_lifecycle · cost_price · competitor_price · average_rating
review_count · historical_sales · profit_margin · supplier_name
```

Categorical columns (`category`, `brand`, `season`, `promotion_type`, `supplier_name`) pass through a `OneHotEncoder`. Numerical columns pass through unchanged. The full `ColumnTransformer + XGBRegressor` pipeline is serialized as a single `.pkl` file.

**Post-prediction business rules:**

- If `predicted_price < cost_price × 1.10` → price is clamped to the cost floor
- If an active promotion type is detected → a deterministic multiplier is applied (e.g., Festival Offer → ×0.95, Flash Sale → ×0.92)
- Prediction stability (50–100%) is estimated from XGBoost tree-level variance

**Validation Results:**

| Metric | Score |
|--------|-------|
| MAE | ₹18.42 |
| RMSE | ₹28.17 |
| R² | 0.985 |
| Test rows | ~16,000 (temporal holdout) |

---

### Demand Forecasting

Six separate gradient-boosted models cover forecasting horizons from 7 days to 365 days. The 7d, 14d, 30d, and 90d models are fully validated on genuine historical records. The 180d and 365d models are experimental and marked accordingly in the UI.

**Training methodology:**
- Time-series expanding-window cross-validation (3–4 folds per horizon)
- A fixed genuine data cutoff (`2026-08-10`) prevents any synthetic or simulated rows from entering the validation set
- A separately fitted `OrdinalEncoder` artifact (`demand_encoder.pkl`) is used at inference time to guarantee identical category mappings

**Validated Performance:**

| Horizon | R² | MAE (units) | sMAPE |
|---------|-----|-------------|-------|
| 7-day | 0.774 | 54.2 | 14.5% |
| 14-day | 0.694 | 119.5 | 17.7% |
| 30-day | 0.532 | 271.9 | 20.7% |
| 90-day | 0.388 | 891.8 | 19.8% |

Each forecast also returns seasonal demand analysis, upcoming holiday and festival events within the window, and a confidence score derived from R² and sMAPE.

---

## API Reference

All routes are prefixed `/api/v1`. Authentication uses `Authorization: Bearer <JWT>`.

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/auth/login` | POST | Returns JWT access token |
| `/auth/register` | POST | Creates new user account |
| `/dashboard/kpis` | GET | Total revenue, ASP, product count, avg demand |
| `/dashboard/revenue-by-category` | GET | Category-level revenue breakdown |
| `/dashboard/inventory-overview` | GET | Stockout / low / medium / high counts |
| `/products` | GET | Paginated product catalog |
| `/products` | POST | Create product |
| `/products/{id}` | PUT / DELETE | Update or remove product |
| `/predictions/price` | POST | XGBoost price prediction + recommendation |
| `/predictions/demand` | POST | Demand forecast for a product and horizon |
| `/analytics/revenue-trend` | GET | Weekly revenue trend data |
| `/analytics/category-margin` | GET | Gross margin by category |
| `/competitors/sync/{id}` | GET | Trigger live competitor price sync |
| `/competitors/status/{id}` | GET | Last sync result for a product |

Interactive API docs available at `http://127.0.0.1:8000/docs` when the backend is running.

---

## Dashboard Pages

| Page | Purpose |
|------|---------|
| Dashboard | Revenue KPIs, trend chart, inventory distribution, top products |
| Products | Full catalog with search, sort, pagination, add/edit/delete |
| Price Prediction | Enter product details → get XGBoost recommendation + 12-factor breakdown |
| Demand Forecasts | Select product and horizon → see demand trend, seasonal chart, holiday events |
| Revenue Optimization | Batch view of all 828 products ranked by projected revenue uplift |
| Analytics | Revenue by category, margin analysis, product lifecycle breakdown |
| Competitor Intelligence | Per-product Amazon and Flipkart live price comparison |
| Executive BI | Category profit bridge table, margin analysis, printable layout |
| Landing / Login / Register | Public pages and authentication |

All pages are fully responsive from 320px mobile to 1440px desktop.

---

## Setup and Installation

### Requirements
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 16 running locally

### Backend

```bash
cd backend

# Create virtual environment
python -m venv ../venv

# Activate (Windows)
..\venv\Scripts\Activate.ps1
# Activate (macOS / Linux)
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (first time)
alembic upgrade head

# Seed product and sales data (first time)
python sync_db_with_dataset.py
python populate_marketplace_metadata.py

# Start the server
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/pricepilot_ai
ENVIRONMENT=development
SECRET_KEY=<strong-random-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

RAPID_API_KEY=<rapidapi-key>
AMAZON_API_HOST=real-time-amazon-data.p.rapidapi.com
FLIPKART_API_HOST=flipkart-apis.p.rapidapi.com
COMPETITOR_SYNC_COOLDOWN_SECONDS=60

SERPAPI_API_KEY=<serpapi-key>
ZENROWS_API_KEY=<zenrows-key>
SCRAPINGDOG_API_KEY=<scrapingdog-key>
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

> Never commit `.env` to version control. Use `.env.example` as a template.

---

## Validation and Benchmarking

The `backend/ml/evaluation/` directory contains the full audit trail:

| Script | Purpose |
|--------|---------|
| `evaluate_price_model.py` | Temporal holdout evaluation of XGBoost pipeline |
| `evaluate_demand_model.py` | Horizon-by-horizon demand model validation |
| `validate_recommendations.py` | Recommendation engine coverage and quality audit |
| `benchmark_api.py` | API response time benchmarking under concurrent load |
| `inspect_dataset.py` | Provenance and data quality inspection |

---

## Known Limitations

- The backend retrains demand models at startup; model caching should be added before production scale-up.
- Competitor sync is rate-limited by the external API quotas; the cooldown is configurable via `COMPETITOR_SYNC_COOLDOWN_SECONDS`.
- The 180-day and 365-day demand models lack sufficient genuine historical validation data and are marked Experimental in the UI.
- CORS is currently open (`*`); this should be restricted to the frontend domain before production deployment.

---

*K. Mohammad Sadik — Dynamic Pricing Optimization and Revenue Intelligence Internship Project*
