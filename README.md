# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

Welcome to the **PricePilot AI** repository. This project uses a clean, standard, and easy-to-understand architecture, ensuring rapid development without overwhelming directory structures.

---

## 📁 Project Directory Tree

```text
PricePilot_AI/
│
├── backend/                  # Python/FastAPI Backend Application
│   ├── alembic/              # Database migration scripts
│   ├── app/                  # Main application code
│   │   ├── api/              # API endpoints and routers (Controllers)
│   │   ├── core/             # Core security and application configuration
│   │   ├── models/           # SQLAlchemy ORM models (Database tables)
│   │   ├── schemas/          # Pydantic models (Data validation)
│   │   ├── services/         # Business Logic layer
│   │   └── utils/            # Helper functions and utilities
│   ├── venv/                 # Virtual Environment (Generated Locally)
│   ├── .env                  # Environment variables for backend
│   ├── Dockerfile            # Container configuration for the backend
│   ├── main.py               # FastAPI application entry point
│   ├── README.md             # Backend-specific documentation
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React.js (Vite) Frontend Application
│   ├── public/               # Static assets
│   ├── src/                  # Main source code
│   │   ├── assets/           # Images, SVGs, and fonts
│   │   ├── components/       # Reusable UI components (Buttons, Cards)
│   │   ├── pages/            # Top-level page components representing routes
│   │   ├── services/         # API clients (Axios)
│   │   ├── styles/           # Global CSS and Tailwind configurations
│   │   └── utils/            # Helper functions
│   ├── .env                  # Environment variables for frontend
│   ├── App.jsx               # Root component
│   ├── main.jsx              # React entry point
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.js        # Vite bundler configuration
│
├── ml/                       # Machine Learning Directory
│   ├── data/                 # Raw and processed datasets
│   ├── models/               # Model definitions and saved serialized models
│   └── notebooks/            # Jupyter notebooks for experimentation
│
├── docs/                     # Documentation folder (markdown files go here)
│
├── .env.example              # Template for root-level environment variables
├── .gitignore                # Files and folders to exclude from version control
├── docker-compose.yml        # Orchestrates local development (DB, API, Web)
└── LICENSE                   # Open-source licensing agreement
```

---

## Why this Structure?

This structure removes unnecessary "Enterprise Bloat" and strictly focuses on what you actually need to build PricePilot AI:

1. **`backend/`**: A standard FastAPI layout. 
   - Requests come into `api/`.
   - Business rules are applied in `services/`.
   - Data is validated by `schemas/` and stored in Postgres via `models/`.
2. **`frontend/`**: A standard Vite/React layout. 
   - `pages/` handle the routing.
   - `components/` handle the reusable UI.
   - `services/` handle fetching data from the FastAPI backend.
3. **`ml/`**: A streamlined folder for Data Scientists to explore data in `notebooks/`, process it in `data/`, and save their results in `models/`.

This lean architecture allows you to move fast and naturally add complexity (like `middlewares` or `store`) only when the project actually requires it.
