# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

Welcome to the **PricePilot AI** repository. This is an AI-powered dynamic pricing platform that helps businesses optimize product prices based on market demand, competitor pricing, customer behavior, and sales performance.

---

## 🎯 Milestone 1 Completion (Project Initialization, Design & Core Setup)

We have successfully completed **Milestone 1**, laying an enterprise-grade foundation for the application. Here is a breakdown of what has been implemented so far:

### 1. Modern Full-Stack Architecture
*   **Frontend**: React + Vite + Tailwind CSS + Recharts (Clean, Enterprise Dark Theme)
*   **Backend**: FastAPI + Python (High-performance API)
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy
*   **Migrations**: Alembic

### 2. Enterprise Authentication & Role-Based Access Control (RBAC)
*   Implemented **JWT (JSON Web Token)** based secure authentication.
*   Built **Role-Based Access Control (RBAC)** restricting endpoints and frontend routes based on specific roles:
    *   **Admin**: Full access, user management, and dataset uploads.
    *   **Pricing Manager**: Access to pricing predictions, products, and competitor data.
    *   **Business Analyst**: Access to revenue forecasts and analytics dashboards.
*   Automatic session expiration, secure password hashing (bcrypt), and unauthorized redirect handling.

### 3. Data Engineering & Migration
*   Engineered a highly optimized CSV Upload pipeline using **Pandas** and SQLAlchemy bulk inserts, capable of handling large files seamlessly.
*   Implemented an **Anti-Join Algorithm** during dataset uploads to auto-sync new products without duplicating existing database records.
*   The database currently houses over **345,600** individual product records with rich dimensions like region, seasonality, promotion types, and stockout flags.

### 4. Product & Pricing Data Module
*   **Products Data Grid**: A responsive, paginated table displaying SKUs, brands, base prices, revenue, and inventory levels.
*   **Product Details Dashboard**: A dedicated view for each product, breaking down sales metrics, promotional history, and regional context (fully localized to Indian Rupees `₹`).
*   **Full CRUD Operations**: Admins can Create, Read, Update, and Soft-Delete products. Includes robust SQLAlchemy `IntegrityError` handling to prevent duplicate SKUs.

### 5. Business Intelligence (BI) Analytics Dashboard
Built a comprehensive executive dashboard capable of analyzing large datasets in milliseconds using optimized **SQLAlchemy aggregate functions**.

*   **Real-time KPI Cards**: Total Revenue, Average Selling Price, Total Products, Average Demand Score.
*   **Revenue Analysis**: Horizontal Bar charts breaking down revenue by Category and top Brands.
*   **Inventory Overview**: Donut chart tracking Stockout, Low, Medium, and High inventory levels.
*   **Promotion Analysis**: Composed chart analyzing the correlation between Promotion Types, Revenue, and Average Discount.
*   **Business Alerts Workflows**: Actionable insights for Low Inventory, High Discount, and Low Margin products.

---

## 📁 Core Architecture Overview

Our workspace is strictly divided into an enterprise 3-tier architecture:

```text
PricePilot_AI/
│
├── frontend/                 # 1. Presentation Layer (React + Vite)
│   ├── public/               # Static web assets
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable UI elements (Charts, Layouts, Modals)
│   │   ├── pages/            # View routes (Dashboard, Products, Analytics, etc.)
│   │   └── services/         # Axios API integration & Auth management
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
├── backend/                  # 2. Application Logic & Data Layer (FastAPI + Python)
│   ├── app/                  # Main server logic
│   │   ├── api/              # HTTP Endpoints (Auth, Dashboard, Products)
│   │   ├── crud/             # Database queries and transactions
│   │   ├── models/           # SQLAlchemy Data models
│   │   └── schemas/          # Pydantic validation schemas
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Server entry point
│
├── docs/                     # Comprehensive System Documentation
│   ├── 02_System_Architecture.md
│   ├── 03_UI_Wireframes.md
│   ├── 04_Workflow_Planning.md
│   └── ...
│
└── README.md                 # Project documentation
```

---

## 🔮 Future Plans: Milestone 2 & Beyond (Machine Learning)

With the core infrastructure, database pipelines, and BI analytics fully operational, our next major steps involve the integration of predictive intelligence.

### 1. Demand Forecasting Module
*   **Goal**: Predict future product demand (Short, Medium, and Long term) using historical sales, pricing, inventory, and seasonal trends.
*   **Technologies**: We will integrate Time-Series models (Prophet, ARIMA) and Machine Learning Regressors (XGBoost, Random Forest).
*   **Outputs**: Predicted units sold, Demand Trend Classification (Increasing/Stable/Decreasing), and Forecast Confidence Scores.

### 2. Price Prediction & Optimization Module
*   **Goal**: Recommend the mathematically optimal price point for a product to maximize revenue without triggering a massive drop in demand (price elasticity).
*   **Implementation**: Develop endpoints that simulate revenue outcomes across various price points and provide intelligent pricing recommendations.

### 3. Competitor Analysis Module
*   **Goal**: Allow pricing managers to track market positioning against competitors, identifying pricing opportunities or vulnerabilities.
*   **Features**: Market comparison charts, competitive positioning matrices, and automated alerts for underpriced/overpriced items.

### 4. Advanced Revenue Simulation
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
