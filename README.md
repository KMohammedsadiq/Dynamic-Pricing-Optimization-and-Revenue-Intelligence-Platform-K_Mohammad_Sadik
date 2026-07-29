# PricePilot AI – Dynamic Pricing Optimization System

Welcome to the **PricePilot AI** repository. This project utilizes a highly focused, strict 3-tier architecture designed for scalability, data processing, and machine learning integration.

---

## 🌟 Current Progress & Features Built (Phases 1 & 2)

We have successfully laid a massive, enterprise-grade foundation for the application. Here is a breakdown of what has been implemented so far:

### 1. Modern Full-Stack Architecture
*   **Frontend**: React + Vite + Tailwind CSS + Recharts
*   **Backend**: FastAPI + Python
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy
*   **Migrations**: Alembic

### 2. Enterprise Authentication & RBAC
*   Implemented **JWT (JSON Web Token)** based secure authentication.
*   Built **Role-Based Access Control (RBAC)** restricting endpoints and frontend routes based on three distinct roles:
    *   **Admin**: Full access, user management, and data uploads.
    *   **Pricing Manager**: Access to pricing predictions, products, and competitor data.
    *   **Business Analyst**: Access to revenue forecasts and analytics dashboards.
*   Automatic session expiration and unauthorized redirect handling.

### 3. Data Engineering & Migration
*   Engineered a highly optimized CSV Upload pipeline using **Pandas** and SQLAlchemy bulk inserts, capable of handling large files seamlessly.
*   Executed a zero-downtime database migration using Alembic to upgrade our data schema to support the **`retail_pricing_demand_100k.csv`** dataset.
*   The database currently houses over **345,600** individual product records with rich dimensions like region, seasonality, promotion types, and stockout flags.

### 4. Interactive Product Management
*   **Products Data Grid**: A responsive, sortable table displaying product IDs, brands, prices, revenue, and inventory.
*   **Product Details Dashboard**: A dedicated view for each product, breaking down sales metrics, promotional history, and regional context.

### 5. Business Intelligence (BI) Analytics Dashboard
Built a comprehensive executive dashboard capable of analyzing 345,600+ rows in milliseconds using optimized **SQLAlchemy aggregate functions** directly in the database. 

*   **Real-time KPI Cards**: Total Revenue, Average Selling Price, Total Products, Average Demand Score, etc.
*   **Revenue Analysis**: Horizontal Bar charts breaking down revenue by Category and top 10 Brands.
*   **Inventory Overview**: Donut chart tracking Stockout, Low, Medium, and High inventory levels.
*   **Promotion Analysis**: Composed chart analyzing the correlation between Promotion Types, Revenue, and Average Discount.
*   **Regional & Seasonal Performance**: Visualizing sales patterns across different geographic regions and seasons.

---

## 📁 Core Architecture Overview

Our workspace is divided strictly into three pillars:

```text
PricePilot_AI/
│
├── frontend/                 # 1. Presentation Layer (React + Vite)
│   ├── public/               # Static web assets
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable UI elements (Charts, Layouts)
│   │   ├── pages/            # View views/routes (Dashboard, Products)
│   │   └── services/         # Axios API integration
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
├── backend/                  # 2. Application Logic & AI (FastAPI + Python)
│   ├── app/                  # Main server logic
│   │   ├── api/              # HTTP Endpoints (Auth, Dashboard, Products)
│   │   ├── models/           # SQLAlchemy Data models
│   │   └── core/             # Security and configurations
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Server entry point
│
├── docker-compose.yml        # Orchestration (links the 3 tiers together locally)
├── .env.example              # Environment variables template
└── README.md                 # Project documentation
```

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

---

## 🔮 Next Steps: Phase 3 (Machine Learning)
With the data ingestion and analytics pipeline fully established, the next phase of development will focus on integrating **Machine Learning Models** for price prediction, demand forecasting, and competitor analysis.
