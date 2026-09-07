# PricePilot AI — Complete Project Explanation

> This document covers everything about the PricePilot AI project — what it is, why each tool was chosen, how everything works, and the full workflow from data to dashboard. Written in simple language for a mentor presentation.

---

## 1. What is PricePilot AI?

PricePilot AI is a **smart pricing system** for retail businesses.

**The problem it solves:**
Retail businesses struggle to decide the right price for their products. If the price is too high, customers go to competitors. If the price is too low, the business loses money. Currently, most pricing decisions are made manually, based on gut feeling.

**What PricePilot AI does:**
It uses machine learning (AI) to look at historical sales data, current demand, competitor prices, inventory levels, and other business signals — and then recommends the best price for each product. It also explains *why* that price is recommended, so the pricing manager can understand and trust the decision.

**In one line:**
> PricePilot AI takes raw business data and turns it into a clear, explainable pricing recommendation with projected revenue impact.

---

## 2. The Core Business Problem

Imagine a retail company selling 828 different products. Every day, they need to answer:

- Is our price for Product A too high compared to Amazon?
- Should we lower the price because demand is falling?
- Is our inventory running low and should we raise the price?
- What will happen to revenue if we change the price by 10%?

PricePilot AI answers all of these questions automatically, for all 828 products, using data.

---

## 3. Complete System Architecture

The system has 3 main parts working together:

```
PART 1: FRONTEND (What the user sees)
React application running in the browser
Users log in → see dashboards → get pricing recommendations

PART 2: BACKEND (The brain of the system)
FastAPI server written in Python
Handles all requests, runs ML models, talks to database

PART 3: DATABASE (Where all data is stored)
PostgreSQL database
Stores all product data, sales history, user accounts, competitor prices
```

**How they connect:**
1. User opens the browser (React app)
2. React app sends requests to FastAPI backend
3. FastAPI runs calculations and queries the database
4. Results come back to the browser and are displayed as charts and tables

---

## 4. Technology Choices — What Was Used and Why

### 4.1 React (Frontend Framework)

**What it is:** React is a JavaScript library for building user interfaces.

**Why it was chosen:**
- It allows building a fast, interactive dashboard without reloading the page every time
- Components (reusable pieces of UI) make the code organized
- Very widely used in the industry — large community and support
- Works perfectly with Vite for fast development

**How it is used in this project:**
- Every page (Dashboard, Products, Price Prediction, Forecasts, Analytics, Competitors) is a separate React component
- Data from the backend API is fetched and displayed as charts and tables
- When a pricing manager clicks "Get Recommendation", React sends a request to the backend and shows the result without refreshing the page

---

### 4.2 Vite (Build Tool)

**What it is:** Vite is a modern build tool that makes React development faster.

**Why it was chosen:**
- Extremely fast hot reload — when code changes, the browser updates instantly
- Simple configuration
- Produces optimized production builds (`npm run build`)

**How it is used:**
- `npm run dev` starts the development server
- `npm run build` creates the `dist/` folder with optimized files for deployment
- Environment variables like `VITE_API_BASE_URL` are handled by Vite

---

### 4.3 Tailwind CSS (Styling)

**What it is:** Tailwind CSS is a utility-first CSS framework. Instead of writing CSS files, you add class names directly in HTML/JSX.

**Why it was chosen:**
- Very fast to build good-looking UIs
- Built-in dark mode support
- Responsive design is easy — classes like `sm:`, `md:`, `lg:` control how things look on different screen sizes
- No need to name CSS classes or manage separate CSS files

**How it is used:**
- All pages are styled with Tailwind classes
- The dark-mode enterprise design (dark backgrounds, colored accent text, clean table layouts) is achieved entirely with Tailwind
- All pages are responsive — they work on both mobile and laptop screens

---

### 4.4 Recharts (Data Visualization)

**What it is:** Recharts is a charting library built for React.

**Why it was chosen:**
- Built specifically for React — integrates naturally with component-based development
- Supports all chart types needed: line charts, bar charts, donut/pie charts
- Interactive — users can hover on charts to see exact values
- Easy to customize colors and styles

**How it is used:**
- Revenue trend line chart on the Dashboard
- Revenue by category horizontal bar chart on Analytics
- Inventory distribution donut chart on Dashboard
- Demand forecast time series chart on Forecasts page

---

### 4.5 Axios (HTTP Client)

**What it is:** Axios is a JavaScript library for making HTTP requests (API calls).

**Why it was chosen:**
- Simpler API than the built-in `fetch` in JavaScript
- Supports interceptors — code that runs before every request or after every response
- Automatically converts JSON responses

**The key use in this project:**
An Axios **request interceptor** automatically adds the JWT authentication token to every API call:

```
User logs in → gets a JWT token
Every subsequent API request → interceptor adds "Authorization: Bearer <token>"
Backend verifies token → serves the data
```

If the token expires (401 error), the interceptor automatically logs the user out and redirects to the login page.

---

### 4.6 FastAPI (Backend Framework)

**What it is:** FastAPI is a modern Python framework for building REST APIs.

**Why it was chosen:**
- Very fast (one of the fastest Python frameworks)
- Automatic API documentation — going to `/docs` shows an interactive page where you can test every API endpoint
- Uses Python type hints — makes code cleaner and prevents bugs
- Built-in data validation using Pydantic
- Supports async operations — handles many requests simultaneously

**How it is used:**
- All 20+ API endpoints are defined in FastAPI
- Each endpoint handles a specific function: login, get products, run ML prediction, sync competitor prices, etc.
- FastAPI automatically validates incoming data and returns clean error messages if something is wrong

---

### 4.7 Uvicorn (Web Server)

**What it is:** Uvicorn is the ASGI web server that runs the FastAPI application.

**Why it was chosen:**
- It is the recommended server for FastAPI
- Supports async operations (ASGI standard)
- Very lightweight and fast

**How it is used:**
```bash
uvicorn main:app --reload
```
- `main` refers to the `main.py` file
- `app` is the FastAPI application object inside that file
- `--reload` means the server restarts automatically when code changes (development only)

---

### 4.8 SQLAlchemy (ORM — Object Relational Mapper)

**What it is:** SQLAlchemy is a Python library that lets you interact with a database using Python classes and objects instead of writing raw SQL.

**Why it was chosen:**
- No need to write complex SQL queries manually
- Database tables are defined as Python classes (called Models)
- Prevents SQL injection attacks automatically
- Easy to switch databases if needed

**Example of how it simplifies code:**

Without SQLAlchemy (raw SQL):
```sql
SELECT * FROM products WHERE category = 'Electronics' ORDER BY base_price DESC;
```

With SQLAlchemy (Python):
```python
db.query(Product).filter(Product.category == "Electronics").order_by(Product.base_price.desc()).all()
```

**How it is used:**
- Every database table (products, users, historical_data, competitor_prices) has a corresponding Python class in `backend/app/models/`
- All data reads and writes go through SQLAlchemy

---

### 4.9 Alembic (Database Migrations)

**What it is:** Alembic is a database migration tool for SQLAlchemy.

**Why it was chosen:**
- When the database structure (tables, columns) needs to change, Alembic tracks those changes like Git tracks code changes
- Allows upgrading and downgrading the database schema safely

**How it is used:**
```bash
alembic upgrade head   # Apply all pending database changes
alembic downgrade -1   # Undo the last change
```

---

### 4.10 Pydantic (Data Validation)

**What it is:** Pydantic is a Python library for data validation using type hints.

**Why it was chosen:**
- FastAPI is built on top of Pydantic
- Ensures that API requests have the correct data types and required fields
- Automatically converts data (e.g., string "123" becomes integer 123)
- Reads environment variables from `.env` files (using `pydantic-settings`)

**Example:**
```python
class ProductCreate(BaseModel):
    product_name: str        # Required string
    base_price: float        # Required float
    category: str = "Other"  # Optional with default
```

If a user sends a request without `product_name`, FastAPI automatically returns a clear error message.

**Key use:** The `Settings` class in `config.py` uses Pydantic to read all environment variables from the `.env` file and make them available throughout the application.

---

### 4.11 PostgreSQL (Database)

**What it is:** PostgreSQL is a powerful, open-source relational database.

**Why it was chosen:**
- Very reliable and handles large amounts of data well
- The project has 300,000+ product records — PostgreSQL handles this efficiently
- Supports complex queries needed for analytics (GROUP BY, JOIN, aggregations)
- Industry standard for enterprise applications
- Free and open source

**Key tables in the database:**
- `products` — all product details (name, price, category, inventory, etc.)
- `users` — user accounts with hashed passwords and roles
- `historical_data` — weekly sales records used for demand forecasting
- `competitor_prices` — cached results from Amazon/Flipkart price syncs
- `marketplace_metadata` — Amazon ASINs and Flipkart FSNs per product

---

### 4.12 XGBoost (Price Optimization Model)

**What it is:** XGBoost (Extreme Gradient Boosting) is a machine learning algorithm that builds many decision trees and combines them to make accurate predictions.

**Why it was chosen over other algorithms:**
- Very accurate on tabular/structured data (which is exactly what this project has)
- Handles missing values gracefully
- Fast training and prediction
- Industry standard for pricing and demand prediction problems
- Outperformed Random Forest in initial tests (lower MAE and higher R²)

**How it works in simple terms:**
Imagine teaching a junior employee to set prices by showing them 100,000 past examples:
- "When demand was high and inventory was low, the best price was ₹1,200"
- "When there was a Flash Sale promotion, the best price was ₹950"
- XGBoost learns these patterns across all 17 features and applies them to new products

**The pipeline:**
```
17 business features → Preprocessing → XGBoost → Price Multiplier
```

The model does not predict a price directly. It predicts a **multiplier** (e.g., 1.08 = raise price by 8%). Then:
```
Optimal Price = Predicted Multiplier × Current Price
```

**Validation result:** R² = 0.985 (the model explains 98.5% of price variation — very high accuracy)

---

### 4.13 Scikit-learn (ML Preprocessing)

**What it is:** Scikit-learn is a Python machine learning library. In this project, it is used specifically for the preprocessing pipeline.

**Why it was chosen:**
- The `Pipeline` and `ColumnTransformer` classes allow bundling the data preprocessing and the model into one single object
- This single object (`.pkl` file) can be saved and loaded for production use
- Prevents "training/serving skew" — the same preprocessing that happened during training happens exactly the same way during prediction

**What the preprocessor does:**
- **OneHotEncoder**: Converts text categories (like "Electronics", "Summer", "Flash Sale") into numbers the model can understand
- **Passthrough**: Keeps numerical columns (price, inventory, demand_index) as they are

```
ColumnTransformer:
├── OneHotEncoder → [category, brand, season, promotion_type, supplier_name]
└── Passthrough   → [base_price, inventory_level, cost_price, ...]
```

---

### 4.14 Pandas (Data Processing)

**What it is:** Pandas is a Python library for working with tabular data (like Excel spreadsheets but in code).

**Why it was chosen:**
- The demand forecasting dataset is a large CSV file with 180,000+ rows
- Pandas loads, filters, and processes this data efficiently
- All feature engineering (calculating lag values, rolling averages, growth rates) is done with Pandas

**Key uses:**
- Loading the demand forecasting CSV at startup
- Filtering data by product ID and date
- Calculating 4-week rolling sales averages
- Detecting genuine vs. synthetic data rows using the `is_synthetic` column

---

### 4.15 NumPy (Numerical Computing)

**What it is:** NumPy provides fast numerical operations in Python, especially for arrays.

**Why it was chosen:**
- Pandas and Scikit-learn both use NumPy internally
- Used for calculating prediction stability scores from the XGBoost model's tree variance

---

### 4.16 JWT Authentication (python-jose + passlib)

**What JWT is:** JSON Web Token — a secure way to prove that a user is logged in without sending their password on every request.

**How authentication works in this project:**

```
Step 1: User sends username + password to /api/v1/auth/login
Step 2: Backend verifies the password using bcrypt hash comparison
Step 3: If correct, backend creates a JWT token signed with a secret key
Step 4: Token is sent back to the frontend
Step 5: Frontend stores the token and sends it in every future request
Step 6: Backend verifies the token on every protected route
Step 7: Token expires after 1440 minutes (24 hours)
```

**Why bcrypt for passwords?**
Passwords are never stored in plain text. bcrypt converts the password into a secure hash. Even if the database is leaked, passwords cannot be recovered.

**Role-Based Access Control (RBAC):**
Three roles exist in the system:
- **Admin** — full access including user management
- **Pricing Manager** — can view and edit products, run predictions
- **Business Analyst** — read-only access to analytics and reports

---

### 4.17 RapidAPI — Amazon & Flipkart (Competitor Intelligence)

**What it is:** RapidAPI is a marketplace for third-party APIs. This project uses two APIs from RapidAPI:
- `real-time-amazon-data` — fetches live product prices from Amazon India
- `flipkart-apis` — fetches live product prices from Flipkart

**Why it was chosen:**
- Getting competitor prices in real-time is essential for dynamic pricing
- These APIs provide structured data (price, rating, availability) without needing to scrape Amazon/Flipkart directly
- Simple HTTP requests — easy to integrate

**How it works:**
```
Pricing Manager clicks "Sync Live Prices" for a product
→ Backend sends product name to Amazon/Flipkart API
→ API returns current price, rating, availability
→ Backend saves result to database
→ Dashboard shows: Our Price vs. Amazon vs. Flipkart
```

**Rate limiting protection:** A cooldown timer (configurable in `.env`) prevents the system from calling the APIs too frequently and exhausting the API quota.

---

### 4.18 SerpApi (Google Shopping)

**What it is:** SerpApi scrapes Google Search results (including Google Shopping) and returns structured data.

**Why it was chosen:**
- Google Shopping shows prices from multiple retailers at once
- Provides a broader view of market prices beyond just Amazon and Flipkart
- Returns clean JSON data without needing to parse HTML

---

### 4.19 ZenRows & ScrapingDog (Scraping Fallbacks)

**What they are:** Web scraping services that handle the complexities of scraping modern websites (JavaScript rendering, CAPTCHAs, IP rotation).

**Why they were included:**
- As fallback options when RapidAPI or SerpApi quotas are exhausted
- Used in the `competitor_scraper/` module for direct website scraping

---

## 5. The Machine Learning Workflow in Detail

### 5.1 Price Prediction — Step by Step

**Training Phase (done once, model saved as .pkl file):**

```
1. Load retail_price_optimization_dataset_improved.csv
2. Split data chronologically: 80% training, 20% testing
   (Most recent 20% is the test set — simulates real-world use)
3. Define 17 input features
4. Build ColumnTransformer:
   - OneHotEncoder for categorical columns
   - Passthrough for numerical columns
5. Create XGBRegressor with optimal hyperparameters
6. Train the pipeline on training data
7. Evaluate on test data: MAE=₹18.42, RMSE=₹28.17, R²=0.985
8. Save the entire pipeline (preprocessor + model) as optimal_price_pipeline.pkl
```

**Inference Phase (happens on every API call):**

```
1. User selects a product in the dashboard
2. Backend loads product details from PostgreSQL
3. Constructs 17-feature dictionary:
   {category, brand, season, base_price, promotion_type,
    inventory_level, demand_index, launch_year, days_since_launch,
    product_lifecycle, cost_price, competitor_price, average_rating,
    review_count, historical_sales, profit_margin, supplier_name}
4. Loads optimal_price_pipeline.pkl (loaded once at startup, reused)
5. Runs pipeline.predict() → returns price multiplier (e.g., 1.07)
6. Calculates: predicted_price = 1.07 × current_price
7. Applies business rules:
   a. Cost Floor: if predicted_price < cost_price × 1.10 → set to cost_price × 1.10
   b. Promotion adjustment: if "Flash Sale" → multiply by 0.92
   c. Re-apply cost floor after promotion adjustment
8. Calculates prediction stability score (50–100%) from tree variance
9. Returns: {predicted_price, multiplier, stability_score}
```

**Why the cost floor rule?**
The ML model optimizes for revenue patterns from training data. But it should never recommend a price below cost + 10% margin. This is a hard business rule that overrides the model to guarantee the business always makes a profit.

---

### 5.2 Demand Forecasting — Step by Step

**The problem:** Predict how many units of a product will sell in the next 7, 14, 30, or 90 days.

**The data:** `demand_forecasting_features.csv` — 828 products × weekly records since the product was first listed. Each row has 41 features including lag values, rolling averages, holiday flags, etc.

**Key concept — Lag Features:**
A lag feature tells the model what happened in the past:
- `units_sold_lag_1` = how many units were sold last week
- `units_sold_lag_2` = two weeks ago
- `rolling_4w_sales_mean` = average sales over the last 4 weeks

The model learns: "If sales were high for the past 4 weeks and there's an upcoming holiday, expect a further increase."

**Training methodology — Time Series Cross-Validation:**

Normal machine learning splits data randomly. But time series data cannot be split randomly — you cannot use future data to predict the past. So we use an "expanding window" approach:

```
Fold 1: Train on weeks 1-50  → Test on weeks 51-60
Fold 2: Train on weeks 1-60  → Test on weeks 61-70
Fold 3: Train on weeks 1-70  → Test on weeks 71-80
Fold 4: Train on weeks 1-80  → Test on weeks 81-90
```

The model that performs best across all folds is saved as the final model.

**Important data quality rule:**
The dataset contains two types of data:
- `is_synthetic = 0` → Real historical sales records (genuine data)
- `is_synthetic = 1` → Computer-generated/simulated data to fill gaps

The validation (testing the model's accuracy) is done **only on genuine data** (`is_synthetic = 0`) up to August 10, 2026. This ensures the accuracy numbers reported are real, not inflated by easy synthetic patterns.

**Results:**

| How far ahead | R² Score | What it means |
|---------------|----------|---------------|
| 7 days | 0.774 | Model explains 77.4% of demand variation |
| 14 days | 0.694 | Model explains 69.4% of demand variation |
| 30 days | 0.532 | Model explains 53.2% of demand variation |
| 90 days | 0.388 | Harder to predict — acceptable for long-range planning |

**Why does accuracy decrease for longer horizons?**
This is expected in all forecasting systems. The further into the future, the more uncertain the prediction becomes. A 7-day forecast is much more reliable than a 90-day forecast.

---

### 5.3 The Business Recommendation Engine

After the XGBoost model gives a predicted price, the **recommendation engine** (in `recommendation.py`) evaluates 12 business factors to explain the recommendation in simple language.

**The 12 factors and what they signal:**

| Factor | What it looks at | When it pushes price UP | When it pushes price DOWN |
|--------|-----------------|------------------------|--------------------------|
| Demand Index | demand_index field | Score ≥ 80 (high demand) | Score ≤ 40 (low demand) |
| Inventory Level | units in stock | Very low stock (< 30 units) | Overstocked (too much inventory) |
| Competitor Price | our price vs. competitor | Our price is below market | Our price is above market |
| Promotion Type | active promotion | No active promotion | Active sale/discount running |
| Customer Rating | star rating | Rating ≥ 4.5 stars | Rating ≤ 3.0 stars |
| Product Lifecycle | stage (Growth/Maturity/Decline) | Growth stage (rising product) | Decline stage (fading product) |
| Brand Strength | premium vs. generic | Premium brand | Generic/unknown brand |
| Sales Velocity | historical_sales | High 30-day sales | Very low 30-day sales |
| Base Price vs Current | how discounted it is | Currently discounted (room to raise) | Already at full price |
| Cost Floor Risk | margin headroom | Large gap above cost | Close to cost floor |
| Margin Analysis | current vs. target margin | Current margin below target | Margin far above target |
| Revenue Impact | projected gain/loss | Positive revenue gain | Negative revenue impact |

**Final recommendation output:**
- If predicted price is >5% higher than current → **"Increase Price"**
- If predicted price is >5% lower than current → **"Decrease Price"**
- Otherwise → **"Maintain Current Price"**

Each factor is shown in the dashboard as a colored badge so the pricing manager understands exactly why the system made its recommendation.

---

## 6. The Complete Workflow — From Login to Recommendation

```
Step 1: Pricing manager opens browser → sees Login page
Step 2: Enters email and password
Step 3: Backend checks password using bcrypt → creates JWT token → sends to browser
Step 4: Browser stores token → redirects to Dashboard

Step 5: Dashboard loads
 → React sends request to /api/v1/dashboard/kpis
 → Backend runs SQL aggregations on products table
 → Returns: Total Revenue, Average Price, Product Count, Avg Demand
 → React shows KPI cards

Step 6: Manager goes to Price Prediction page
 → Selects a product from the dropdown (or types manually for a new product)
 → Clicks "Get Recommendation"

Step 7: React sends POST to /api/v1/predictions/price
 → JWT token is automatically attached by Axios interceptor
 → Backend verifies token

Step 8: Backend loads product from PostgreSQL
Step 9: Constructs 17-feature dictionary
Step 10: Runs XGBoost pipeline → gets predicted multiplier
Step 11: Applies cost floor and promotion rules
Step 12: Calculates prediction stability (50–100%)
Step 13: Runs 12-factor analysis in recommendation engine
Step 14: Returns complete response to React

Step 15: React displays:
 → Price Card (current price → recommended price → % change)
 → 12-factor table with color-coded badges
 → Stability gauge
 → Projected revenue gain/loss

Step 16: Manager reviews and manually applies the recommended price if they agree
```

---

## 7. The Frontend Dashboard — Page by Page

### Dashboard Page
The home page after login. Shows at a glance:
- **KPI Cards**: Total Revenue, Average Selling Price, Total Products, Average Demand Score
- **Revenue Trend Chart**: Line chart showing revenue over the last weeks
- **Inventory Distribution**: Donut chart — how many products are at Stockout / Low / Medium / High inventory
- **Top 5 Products**: Table of highest revenue products

### Products Page
Full catalog management:
- Search by name or ID
- Sort by any column
- Paginate through all 828 products
- Add new product (opens a form)
- Edit existing product details
- Delete a product
- CSV upload for bulk product addition

### Price Prediction Page
The main AI feature:
- Two modes: "Existing Product" (search catalog) and "New Product" (enter data manually)
- Form collects all 17 features needed by the XGBoost model
- After submission: shows recommended price, 12-factor analysis, stability score, revenue impact

### Demand Forecasts Page
- Search for a product
- Select forecast horizon: 7 days / 14 days / 30 days / 90 days
- Chart shows historical weekly sales for the last 12 weeks
- Prediction: how many units expected to sell in selected horizon
- Trend: Increasing / Stable / Decreasing
- Seasonal analysis: which season had highest genuine sales
- Holiday events: which festivals fall within the forecast window
- Confidence score: how reliable the prediction is

### Revenue Optimization Page
- Batch view of all 828 products
- Each product is scored by projected revenue improvement
- Products with the biggest revenue opportunity appear first
- Pricing manager can quickly identify which products to reprice first

### Analytics Page
- Revenue by category (bar chart)
- Gross margin by category
- Product lifecycle distribution
- Historical revenue trend (weekly)

### Competitors Page
- Search for a specific product
- Click "Sync Live Prices" → system fetches real-time prices from Amazon and Flipkart
- Shows: Our Price | Amazon Price | Flipkart Price | Market Average
- Market position badge: Lowest / Competitive / Premium

### Executive BI Page
- Category-level profit bridge table
- Gross margin vs. revenue by category
- Designed for management reporting — printable layout

### Landing Page (Public)
- What PricePilot AI does
- Feature highlights
- Login / Register buttons

---

## 8. API Design

The backend follows REST API principles. All endpoints are prefixed with `/api/v1/`.

**Authentication endpoints:**
- `POST /api/v1/auth/register` — create account
- `POST /api/v1/auth/login` — returns JWT token

**Dashboard endpoints:**
- `GET /api/v1/dashboard/kpis` — revenue, ASP, product count, avg demand
- `GET /api/v1/dashboard/revenue-by-category` — category revenue data for bar chart
- `GET /api/v1/dashboard/inventory-overview` — stockout/low/medium/high counts
- `GET /api/v1/dashboard/top-products` — top 5 by revenue
- `GET /api/v1/dashboard/revenue-optimization` — batch recommendations for all products

**Product endpoints:**
- `GET /api/v1/products` — paginated list with search and sort
- `POST /api/v1/products` — create product
- `PUT /api/v1/products/{id}` — update product
- `DELETE /api/v1/products/{id}` — remove product

**ML endpoints:**
- `POST /api/v1/predictions/price` — XGBoost price prediction + recommendation
- `POST /api/v1/predictions/demand` — demand forecast for a product and horizon

**Analytics endpoints:**
- `GET /api/v1/analytics/revenue-trend` — weekly revenue time series
- `GET /api/v1/analytics/category-margin` — gross margin by category

**Competitor endpoints:**
- `GET /api/v1/competitors/sync/{product_id}` — trigger live price sync
- `GET /api/v1/competitors/status/{product_id}` — return last cached result
- `GET /api/v1/amazon/search` — Amazon search proxy
- `GET /api/v1/flipkart/search` — Flipkart search proxy

---

## 9. Database Design

The PostgreSQL database has the following main tables:

### `products` table
Stores the current state of all products:
- `product_id`, `product_name`, `brand`, `category`
- `base_price`, `cost_price`, `current_price`
- `inventory_level`, `demand_index`, `historical_sales`
- `promotion_type`, `season`, `product_lifecycle`
- `average_rating`, `review_count`, `profit_margin`
- `supplier_name`, `launch_year`, `days_since_launch`
- `competitor_price`, `competitor_name`

### `users` table
Stores user accounts:
- `id`, `full_name`, `email`
- `hashed_password` (bcrypt hash — never plain text)
- `role` (Admin / Pricing Manager / Business Analyst)
- `is_active`

### `marketplace_metadata` table
Links products to their marketplace IDs:
- `product_id`, `asin` (Amazon), `fsn` (Flipkart)
- `amazon_price`, `flipkart_price`, `last_synced_at`

---

## 10. Security Implementation

### How JWT Security Works

```
1. User submits login form (email + password)
2. Backend finds user in database by email
3. bcrypt.verify(submitted_password, stored_hash) → True or False
4. If True: create JWT token:
   {
     "sub": "user@email.com",
     "role": "Pricing Manager",
     "exp": 1440 minutes from now
   }
   Token is signed with SECRET_KEY using HS256 algorithm
5. Token sent to frontend → stored in localStorage
6. Every request: "Authorization: Bearer <token>" header
7. Backend decodes token with same SECRET_KEY → extracts user info
8. If token expired or tampered → 401 Unauthorized → redirect to login
```

### Why bcrypt for passwords?
- bcrypt is a slow hashing algorithm (intentionally)
- Even if the database is stolen, attackers cannot reverse the hash to get the original password
- Each hash is unique due to a random "salt" added before hashing

### Environment Variables
All secrets are stored in `.env` files:
- `SECRET_KEY` — for signing JWT tokens
- `DATABASE_URL` — database connection string with password
- API keys for RapidAPI, SerpApi, ZenRows

These are never committed to Git (`.gitignore` prevents it).

---

## 11. Model Files — What Gets Deployed

These are the only files required to run the system in production:

| File | Size | Purpose |
|------|------|---------|
| `optimal_price_pipeline.pkl` | ~2.4 MB | XGBoost price prediction pipeline |
| `demand_encoder.pkl` | ~small | OrdinalEncoder for demand model categories |
| `genuine_7d.pkl` | ~480 KB | 7-day demand forecasting model |
| `genuine_14d.pkl` | ~480 KB | 14-day demand forecasting model |
| `genuine_30d.pkl` | ~480 KB | 30-day demand forecasting model |
| `genuine_90d.pkl` | ~480 KB | 90-day demand forecasting model |
| `demand_forecasting_features.csv` | ~large | Product time-series data for inference |

**Training files NOT needed in production:**
- All `target_Xd_FoldY.pkl` files (20 files used during training only)
- All scripts in `training/` folder (only used to retrain models)
- All scripts in `evaluation/` folder (only used for validation audits)
- Raw training CSVs

---

## 12. Responsive Design

The application works on all screen sizes:

**Mobile (< 1024px):**
- The sidebar collapses into a hamburger menu
- Tables get horizontal scrolling so data is not squashed
- Navigation tabs switch to a horizontal scroll row
- KPI cards stack vertically

**Desktop (≥ 1024px):**
- Full sidebar is always visible on the left
- All tables display all columns
- Charts and cards display side by side

This was achieved by:
- Using Tailwind's `lg:` breakpoint for all layout decisions
- Adding `overflow-x-auto` + `min-w` to all wide tables
- The MainLayout sidebar uses `lg:relative lg:translate-x-0` to stay permanent on desktop

---

## 13. Validation and Testing

### ML Model Validation

**Price Model:**
- Method: 80/20 chronological split (no random shuffle)
- MAE: ₹18.42 (on average, recommendation is off by ₹18)
- RMSE: ₹28.17
- R²: 0.985 (model explains 98.5% of price variation)
- Test set size: ~16,000 rows

**Demand Models:**
- Method: Time-series cross-validation (expanding window, 3–4 folds)
- Validated on genuine historical data only (is_synthetic = 0)
- Fixed cutoff date (2026-08-10) to prevent future data leakage

**Recommendation Engine Audit:**
- All 828 products were run through the full recommendation pipeline
- 100% received a valid recommendation (no null outputs, no errors)
- No product received a recommendation below the cost floor

### API Performance Benchmarking
- `benchmark_api.py` was run to measure response times
- Price prediction endpoint: < 150ms average
- Dashboard KPIs: < 200ms average
- Demand forecast: < 300ms average
- Batch optimization (828 products): ~800ms

---

## 14. Common Questions a Mentor Might Ask

**Q: Why XGBoost instead of a neural network (deep learning)?**
A: XGBoost is the best choice for this type of tabular, structured business data. Neural networks work better for images, text, and audio. For pricing data with clear numerical and categorical features, XGBoost consistently outperforms neural networks and is much faster to train and deploy.

**Q: How do you make sure the model doesn't recommend a losing price?**
A: Two mechanisms. First, the model was trained on historical data where prices were always above cost, so it learns this pattern. Second, a hard business rule (cost floor check) is applied after every prediction: if the recommended price is below `cost_price × 1.10`, the price is automatically raised to that minimum.

**Q: Why store competitor prices in the database instead of always fetching live?**
A: Fetching live prices every time would be slow (each API call takes 1–2 seconds) and would quickly exhaust API quotas (RapidAPI charges per request). So we sync competitor prices on demand (when the user clicks "Sync") and cache the result in the database. A cooldown timer prevents over-fetching.

**Q: What is the difference between is_synthetic=0 and is_synthetic=1 in the dataset?**
A: The demand dataset covers 828 products with weekly records. For products with limited history, some rows were generated by a fill algorithm to complete the time series. These are marked `is_synthetic=1`. Validation is always done only on `is_synthetic=0` rows (real, genuine sales data) to report honest accuracy.

**Q: Why use PostgreSQL instead of SQLite?**
A: SQLite is a file-based database. With 300,000+ product records and concurrent user requests, SQLite would be slow and could have write-locking issues. PostgreSQL supports multiple simultaneous connections, complex queries, and scales to millions of records.

**Q: Why use JWT instead of sessions?**
A: JWT is stateless — the server does not need to store session data. This makes the backend simpler and makes it easy to scale horizontally (run multiple backend servers). The token itself carries all user information and expires automatically.

**Q: How does the 12-factor analysis help the user trust the AI?**
A: Instead of just showing a price number, the system explains in plain English why the price should change. For example: "Demand is high (score 150/200), inventory is low (12 units), and competitor is cheaper by ₹200 — these three factors suggest keeping the price competitive." This builds trust and allows the manager to override the recommendation if they know something the system doesn't.

**Q: Is the demand forecast making decisions or just informing?**
A: Just informing. The demand forecast is an input to help the pricing manager understand future demand trends. It does not automatically change prices. The manager always makes the final decision.

**Q: Why are 180-day and 365-day forecasts marked "Experimental"?**
A: The genuine historical data only covers a limited time window (most products have less than 1 year of data). So when we test the 180-day and 365-day models, there isn't enough genuine future data to properly validate them. The models exist but their accuracy cannot be confirmed, so they are clearly labeled as experimental to set the right expectations.

**Q: What happens if an external API (RapidAPI, SerpApi) is unavailable?**
A: The backend catches API errors and returns an appropriate error message to the frontend. The rest of the application continues to work normally. Competitor prices just show the last cached value until the next successful sync.

**Q: What would need to change to deploy this to production?**
A:
1. Set `debug=False` in `main.py`
2. Set `VITE_API_BASE_URL` to the production backend URL before building the frontend
3. Replace localhost `DATABASE_URL` with a production PostgreSQL URL
4. Restrict CORS to only allow the frontend domain (not `*`)
5. Use a secrets manager for environment variables instead of `.env` files
6. Run the frontend with `npm run build` and serve the `dist/` folder via a web server

---

## 15. Project Summary

PricePilot AI is a complete, working, end-to-end enterprise pricing platform. Here is what was built:

| Component | What Was Built |
|-----------|---------------|
| Frontend | 11-page React dashboard, fully responsive, dark mode |
| Backend | 20+ REST API endpoints, JWT auth, RBAC |
| Database | PostgreSQL with 300,000+ records, migrations with Alembic |
| Price ML | XGBoost v4 pipeline, R²=0.985, validated on 16,000 test rows |
| Demand ML | 4 validated forecast horizons (7d/14d/30d/90d), time-series CV |
| Recommendation | 12-factor business analysis engine, 100% coverage audit |
| Competitor Intel | Live Amazon + Flipkart + Google Shopping price sync |
| Validation | Full audit scripts: price eval, demand eval, recommendation coverage, API benchmark |
| Documentation | Deployment readiness report, project README |

---

*K. Mohammad Sadik — Dynamic Pricing Optimization and Revenue Intelligence Internship Project*
