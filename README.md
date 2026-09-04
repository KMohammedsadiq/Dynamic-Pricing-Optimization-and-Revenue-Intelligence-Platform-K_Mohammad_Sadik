# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

Welcome to the **PricePilot AI** repository. PricePilot AI is an enterprise-grade dynamic pricing platform that empowers businesses to optimize product prices based on market demand, live competitor intelligence, customer behavior, and historical sales performance.

---

## 🌟 Key Features

### 1. AI Price Prediction Engine
*   Powered by a highly tuned **XGBoost regression pipeline** trained on extensive retail datasets.
*   The model predicts optimal price multipliers based on 17 critical business features (Demand, Inventory, Competitor Price, Ratings, Seasonality, etc.).
*   Enforces strict business rules (e.g., hard cost floors) to ensure that AI-driven recommendations are always profitable.

### 2. Time-Series Demand Forecasting
*   Accurately predicts future product demand across multiple horizons (7-day, 14-day, 30-day, and 90-day).
*   Evaluated using strict chronological holdout techniques on genuine historical data.
*   Includes seasonal trend analysis and historical holiday impact insights (e.g., Diwali, Christmas sales surges).

### 3. Intelligent Factor Analysis & Explainability
*   Provides a granular **Recommendation Explainability Engine** that acts as a true Decision Support System.
*   Demystifies the ML output by breaking down exactly *why* a price should increase, decrease, or remain stable using human-readable business logic and impact labels.

### 4. Live Competitor Intelligence
*   Integrates with third-party APIs (RapidAPI, SerpApi, ZenRows) to scrape and sync real-time competitor prices from platforms like Amazon and Flipkart.
*   Provides instant market positioning analysis (Lowest, Highest, Average) to adjust our pricing strategies against the competition dynamically.

### 5. Enterprise-Grade Dashboard & Analytics
*   **Executive BI**: High-level KPIs, margin analysis, and category revenue breakdowns.
*   **Revenue Optimization**: Batch recommendation grids prioritizing high-impact products for immediate pricing action.
*   **Analytics**: Real-time KPI cards, horizontal bar charts for category revenue, and inventory distribution overviews.
*   Fully responsive, dark-mode focused UI built with Tailwind CSS.

---

## 🏗️ Core Architecture

Our workspace follows a strict 3-tier enterprise architecture:

### 1. Frontend (Presentation Layer)
*   **Tech Stack**: React, Vite, Tailwind CSS, Recharts, Lucide Icons.
*   **Role**: Delivers a seamless, highly scannable, data-first user experience. Includes intelligent workflows for both existing catalog products and brand-new cold-start product predictions.

### 2. Backend (Application & API Layer)
*   **Tech Stack**: FastAPI, Python, SQLAlchemy, Pydantic, Alembic.
*   **Role**: High-performance asynchronous API serving the frontend, handling complex data aggregations, and orchestrating external API calls. Features JWT-based authentication and Role-Based Access Control (RBAC).

### 3. Database & Machine Learning Layer
*   **Tech Stack**: PostgreSQL, Scikit-Learn, XGBoost, Pandas.
*   **Role**: Houses over 300,000 product records with highly optimized queries. The ML engine operates entirely independently of database bottlenecks, utilizing lightweight serialized `.pkl` models for rapid inference.

---

## 🚀 How to Run Locally

### 1. Database Setup
Ensure you have PostgreSQL running locally and create a database (default: `pricepilot_ai`).
Configure your `backend/.env` file with the appropriate `DATABASE_URL` and API keys.

### 2. Start the Backend (FastAPI)
Navigate to the `backend` directory, install requirements, activate your virtual environment, and run:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend API will be available at `http://127.0.0.1:8000`.

### 3. Start the Frontend (React + Vite)
Navigate to the `frontend` directory, install Node dependencies, and run:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.
