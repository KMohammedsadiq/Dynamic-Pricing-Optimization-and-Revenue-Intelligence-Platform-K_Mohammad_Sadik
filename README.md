# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

Welcome to the **PricePilot AI** repository. This is an AI-powered dynamic pricing platform that helps businesses optimize product prices based on market demand, competitor pricing, customer behavior, and sales performance.

---

## 🚀 Milestone 2 Completion (Machine Learning & Enterprise AI)

We have successfully completed **Milestone 2**, bringing intelligent predictive capabilities and a professional enterprise design to the platform. 

### 1. AI Price Prediction Engine (XGBoost)
*   Replaced the legacy Random Forest prototype with a production-ready **XGBoost** regression pipeline.
*   The model predicts optimal price multipliers based on 12 critical business features (Demand, Inventory, Competitor Price, Ratings, Seasonality, etc.).
*   Engineered a highly optimized inference pipeline using serialized models (`optimal_price_pipeline.pkl`) that operates entirely independently of database bottlenecks when needed.

### 2. Intelligent Factor Analysis & Explainability
*   Built a custom **Business Recommendation Engine** that wraps around the ML model outputs.
*   Instead of acting as a "black box," the AI provides a granular **12-factor analysis table** explaining exactly *why* a price should increase, decrease, or remain neutral.
*   Human-readable impact labels, color-coded badges, and clear business reasoning make this a true **Decision Support System** for Pricing Managers.

### 3. Dual-Workflow Prediction System
*   **Existing Products**: Pricing managers can instantly select any product from the catalog (via intelligent autocomplete). The system auto-fills current database metrics and predicts the best price adjustment.
*   **New Products**: Added a completely standalone workflow allowing managers to manually enter data for brand-new products (Cost, Lifecycle, Brand, Category). The backend dynamically bypasses database lookups, applies smart defaults (e.g., 0 historical sales, 0 reviews), and generates an instant optimal launch price.

### 4. Enterprise-Grade Dashboard UI
*   Completely redesigned the frontend into a professional, minimal, and highly scannable **Enterprise Dark Mode Dashboard**.
*   Removed overly flashy elements (glassmorphism, gradients) in favor of a clean, data-first approach similar to Amazon Seller Central or Microsoft Admin Center.
*   Implemented a seamless tabbed interface for switching between the New and Existing product prediction workflows.

---

## 🎯 Milestone 1 Completion (Project Initialization & Core Setup)

Our enterprise-grade foundation established in Milestone 1 remains fully operational:

### 1. Modern Full-Stack Architecture
*   **Frontend**: React + Vite + Tailwind CSS + Recharts
*   **Backend**: FastAPI + Python (High-performance API)
*   **Database**: PostgreSQL / SQLite
*   **ORM**: SQLAlchemy
*   **Migrations**: Alembic

### 2. Authentication & Role-Based Access Control (RBAC)
*   Implemented **JWT** based secure authentication with Role-Based Access Control (Admin, Pricing Manager, Business Analyst).
*   Automatic session expiration and secure password hashing (bcrypt).

### 3. Data Engineering & Pipeline
*   Engineered a highly optimized CSV Upload pipeline using **Pandas** and SQLAlchemy bulk inserts.
*   Implemented an **Anti-Join Algorithm** to auto-sync new products without duplicating existing database records.
*   The database currently houses over **345,600** individual product records (localized to Indian Rupees `₹`).

### 4. Business Intelligence (BI) Analytics Dashboard
*   **Real-time KPI Cards**: Total Revenue, Average Selling Price, Total Products, Average Demand Score.
*   **Revenue Analysis**: Horizontal Bar charts breaking down revenue by Category and top Brands.
*   **Inventory Overview**: Donut chart tracking Stockout, Low, Medium, and High inventory levels.

---

## 📁 Core Architecture Overview

Our workspace is strictly divided into an enterprise 3-tier architecture:

```text
PricePilot_AI/
│
├── frontend/                 # 1. Presentation Layer (React + Vite)
│   ├── public/               # Static web assets
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable UI elements (Charts, Layouts, Prediction Cards)
│   │   ├── pages/            # View routes (Dashboard, PricePrediction, Products, etc.)
│   │   └── services/         # Axios API integration & Auth management
│   └── package.json          # Node dependencies
│
├── backend/                  # 2. Application Logic & Data Layer (FastAPI + Python)
│   ├── app/                  # Main server logic (API endpoints, CRUD, Schemas)
│   ├── ml/                   # Machine Learning Engine
│   │   ├── models/           # Serialized XGBoost pipelines (.pkl)
│   │   ├── training/         # Training scripts (train_xgboost.py)
│   │   ├── predictor.py      # ML Inference logic
│   │   └── recommendation.py # Business rules & explainability engine
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Server entry point
│
└── README.md                 # Project documentation
```

---

## 🔮 Future Plans

With the ML Prediction Engine fully operational, our upcoming roadmap includes:

### 1. Demand Forecasting Module
*   **Goal**: Predict future product demand (Short, Medium, and Long term) using historical sales, pricing, inventory, and seasonal trends using Time-Series models (Prophet, ARIMA).

### 2. Advanced Revenue Simulation
*   **Goal**: Interactive "What-If" analysis tools allowing analysts to tweak discount percentages or base prices on the dashboard and instantly see the simulated impact on total projected revenue and profit margins.

---

## 🚀 How to Run Locally

### 1. Start the Backend (FastAPI)
Navigate to the `backend` directory, activate your virtual environment, and run:
```bash
cd backend
..\venv\Scripts\uvicorn main:app --reload
```
The backend API will be available at `http://127.0.0.1:8000`.

### 2. Start the Frontend (React + Vite)
Navigate to the `frontend` directory and run:
```bash
cd frontend
npm run dev
```
The frontend application will be available at `http://localhost:5173`.
