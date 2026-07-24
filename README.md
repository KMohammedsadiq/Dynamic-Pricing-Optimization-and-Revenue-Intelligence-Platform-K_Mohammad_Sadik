# PricePilot AI – Dynamic Pricing Optimization System

Welcome to the **PricePilot AI** repository. This project utilizes a highly focused, strict 3-tier architecture designed for simplicity, modularity, and rapid development.

---

## 📁 Core Architecture Overview

Our workspace is divided strictly into three pillars:

```text
PricePilot_AI/
│
├── frontend/                 # 1. Presentation Layer (React + Vite)
│   ├── public/               # Static web assets
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable UI elements
│   │   ├── pages/            # View views/routes
│   │   └── services/         # API integration
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
├── backend/                  # 2. Application Logic & AI (FastAPI + Python)
│   ├── app/                  # Main server logic
│   │   ├── api/              # HTTP Endpoints
│   │   ├── models/           # Data models
│   │   └── services/         # Core business & ML logic
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Server entry point
│
├── database/                 # 3. Data Persistence Layer
│   └── schema.sql            # Raw SQL schemas, seeds, and migrations
│
├── docker-compose.yml        # Orchestration (links the 3 tiers together locally)
├── .gitignore                # Git exclusions
├── .env.example              # Environment variables template
└── README.md                 # Project documentation
```

---

## 🚀 Why this 3-Tier Structure?

When reviewing this architecture, you will immediately see separation of concerns:

1. **`frontend/`**: Only contains code related to what the user sees and interacts with. It relies exclusively on the backend for data.
2. **`backend/`**: Contains the business logic, machine learning inferences, and API routing. It securely handles data and orchestrates requests between the frontend and the database.
3. **`database/`**: Dedicated solely to persistent storage logic, schemas, and structural definitions.

This clean setup is widely regarded as the industry standard for starting highly scalable, enterprise web applications, ensuring that any developer can instantly locate the code they need without digging through deeply nested folders.
