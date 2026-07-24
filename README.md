# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

Welcome to the **PricePilot AI** repository. This document outlines the comprehensive enterprise-level folder structure, developed in alignment with **Clean Architecture**, modular development, and industry best practices.

---

## 📁 Project Directory Tree

```text
PricePilot_AI/
│
├── backend/                  # Python/FastAPI Backend Application
│   ├── alembic/              # Database migration scripts
│   ├── app/                  # Main application code
│   │   ├── api/              # API endpoints and routers (Controllers)
│   │   ├── config/           # Application configuration and settings
│   │   ├── constants/        # Application-wide constants and enums
│   │   ├── core/             # Core security, dependencies, and events
│   │   ├── database/         # Database connection setup and session management
│   │   ├── dependencies/     # FastAPI Dependency Injection functions
│   │   ├── exceptions/       # Custom error handling and exceptions
│   │   ├── middlewares/      # Request/Response interceptors (CORS, logging)
│   │   ├── models/           # SQLAlchemy ORM models (Database tables)
│   │   ├── repositories/     # Data Access Layer (CRUD abstractions)
│   │   ├── schemas/          # Pydantic models (Data validation/serialization)
│   │   ├── services/         # Business Logic layer
│   │   ├── utils/            # Helper functions and utilities
│   │   └── validators/       # Custom validation logic for schemas
│   ├── tests/                # Unit and Integration tests for backend
│   ├── .env                  # Environment variables for backend
│   ├── Dockerfile            # Container configuration for the backend
│   ├── main.py               # FastAPI application entry point
│   ├── README.md             # Backend-specific documentation
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React.js (Vite) Frontend Application
│   ├── public/               # Static assets that don't go through Webpack/Vite
│   ├── src/                  # Main source code
│   │   ├── assets/           # Images, SVGs, and fonts
│   │   ├── components/       # Reusable UI components (Buttons, Cards)
│   │   ├── config/           # Environment config and global frontend settings
│   │   ├── constants/        # UI constants, route names, action types
│   │   ├── context/          # React Context providers (Theme, Auth)
│   │   ├── features/         # Feature-based modular code (e.g., /dashboard, /pricing)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Page wrappers and structural layouts (Navbar, Sidebar)
│   │   ├── pages/            # Top-level page components representing routes
│   │   ├── routes/           # Routing configuration (React Router)
│   │   ├── services/         # API clients (Axios) and external service integrations
│   │   ├── store/            # Global state management (Redux/Zustand)
│   │   ├── styles/           # Global CSS and Tailwind configurations
│   │   ├── types/            # TypeScript definitions or PropTypes
│   │   └── utils/            # Helper functions (date formatting, calculation)
│   ├── .env                  # Environment variables for frontend
│   ├── App.jsx               # Root component
│   ├── main.jsx              # React entry point
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.js        # Vite bundler configuration
│
├── ml/                       # Machine Learning & Data Science Directory
│   ├── datasets/             # Raw and processed data used for training
│   ├── evaluation/           # Scripts to evaluate model performance and metrics
│   ├── feature_engineering/  # Scripts for creating/transforming features
│   ├── models/               # Model architecture definitions (LSTM, XGBoost)
│   ├── notebooks/            # Jupyter notebooks for EDA and experimentation
│   ├── prediction/           # Scripts to run inference and serve predictions
│   ├── preprocessing/        # Data cleaning and scaling scripts
│   ├── saved_models/         # Serialized/exported models (.pkl, .h5, .onnx)
│   └── training/             # Scripts to train and tune ML models
│
├── docs/                     # Comprehensive Project Documentation
│   ├── API_Documentation/    # Swagger/Postman exports and API usage guides
│   ├── Architecture/         # System architecture decisions (ADRs) and overviews
│   ├── Database_Design/      # Schema documentation and data dictionaries
│   ├── Deployment_Guide/     # CI/CD pipelines, AWS/Azure setup instructions
│   ├── ER_Diagram/           # Entity Relationship diagrams
│   ├── Installation_Guide/   # How to set up the project locally
│   ├── Meeting_Notes/        # Records of stakeholder meetings
│   ├── Sequence_Diagrams/    # Data flow and interaction diagrams
│   ├── Sprint_Notes/         # Agile sprint planning and retrospectives
│   ├── User_Manual/          # Guides for end-users on how to use the platform
│   └── Weekly_Progress/      # Status reports and milestones
│
├── tests/                    # Global Testing Directory
│   ├── api_tests/            # End-to-end API tests (e.g., via Postman/Newman)
│   ├── backend_tests/        # Backend-specific integration/unit tests
│   ├── frontend_tests/       # E2E frontend tests (Cypress/Playwright)
│   ├── integration_tests/    # Tests crossing boundaries (e.g., Backend + DB + ML)
│   └── ml_model_tests/       # Tests verifying model accuracy and data integrity
│
├── datasets/                 # Global shared raw datasets (Large files, ignored by Git)
├── docker/                   # Global Docker configurations (Nginx configs, custom base images)
├── notebooks/                # Global scratchpad notebooks for non-ML specific tasks
├── postman/                  # Postman collections and environment files for API testing
├── ppt/                      # Presentations and slide decks for stakeholders
├── reports/                  # Generated analytics reports or audit logs
├── scripts/                  # Shell scripts for automation (DB backups, CI/CD hooks)
├── .github/                  # GitHub Actions workflows and PR templates
│
├── .env.example              # Template for root-level environment variables
├── .gitignore                # Files and folders to exclude from version control
├── docker-compose.yml        # Orchestrates multi-container local development (DB, API, Web)
├── LICENSE                   # Open-source or proprietary licensing agreement
└── README.md                 # This file
```

---

## 1. Root Project Structure Explanations

- **`backend/` & `frontend/`**: Segregates the core application tiers, allowing independent scaling, deployment, and distinct tech stacks (Python vs JS).
- **`ml/`**: Isolates heavy data science workflows from the standard web application backend. It ensures data scientists have a dedicated space for experimentation without polluting the API code.
- **`datasets/`**: A top-level directory for raw data ingestion before it is pushed into a database. Crucial for reproducible ML pipelines.
- **`docs/`**: Centralizes all knowledge. It ensures that any new developer or stakeholder can understand the project without reading code.
- **`docker/` & `docker-compose.yml`**: Contains containerization configurations. `docker-compose.yml` orchestrates the local dev environment so a single command (`docker-compose up`) starts the entire stack.
- **`postman/`**: Stores exported collections to easily share API testing setups across the team.
- **`notebooks/`**: General exploratory data analysis (EDA) not strictly tied to the core ML pipeline.
- **`reports/` & `ppt/`**: Business-facing deliverables to communicate progress and intelligence to non-technical stakeholders.
- **`tests/`**: The overarching testing suite ensuring code quality and preventing regressions.
- **`scripts/`**: Automation scripts to reduce manual developer toil.
- **`.github/`**: Houses CI/CD pipelines (GitHub Actions) to automate testing and deployment on every push.
- **`.gitignore`**: Prevents sensitive data (credentials, massive datasets, compiled code) from being pushed to GitHub.
- **`LICENSE` & `.env.example`**: `LICENSE` protects intellectual property. `.env.example` provides a safe template for developers to configure their local environments.

---

## 2. Backend Architecture Details

This backend strictly adheres to **Clean Architecture**. The goal is to decouple the business logic from the frameworks (FastAPI) and the database (SQLAlchemy).

### Architectural Data Flow Answers:
- **Which folders expose APIs?**
  - `backend/app/api/`: This is the presentation layer for the backend. It defines endpoints (e.g., `@app.get("/prices")`), handles HTTP requests, and returns HTTP responses.
- **Which folders contain business logic?**
  - `backend/app/services/`: This is the core of the application. It contains the rules of the business (e.g., "How to calculate the optimal price discount"). It is isolated from HTTP and Database logic.
- **Which folders communicate with the database?**
  - `backend/app/repositories/`: This layer abstracts database interactions (CRUD). The `services` layer calls functions here to get data, without needing to know *how* the data is fetched (SQLAlchemy vs raw SQL).
  - `backend/app/models/`: Defines the actual tables using SQLAlchemy.
  - `backend/database/`: Establishes the connection engine and sessions.
- **Which folders interact with ML models?**
  - The `backend/app/services/` layer will call inference functions located in `ml/prediction/` or load models via an internal integration module, allowing the API to return dynamic pricing predictions to the frontend.

### Additional Backend Folders:
- **`schemas/`**: Pydantic models. They validate incoming JSON requests and format outgoing JSON responses, ensuring data integrity before it ever reaches the business logic.
- **`dependencies/`**: Reusable FastAPI dependency injections (e.g., `get_db_session`, `get_current_user`), keeping endpoints clean.
- **`middlewares/`**: Code that runs before/after every request (e.g., logging request times, CORS handling).
- **`alembic/`**: Manages database schema migrations. When you change a `model`, Alembic generates a script to update the actual Postgres database without losing data.
- **`exceptions/` & `validators/`**: Standardizes error responses (e.g., 404 Not Found, 400 Bad Request) and custom validation logic (e.g., ensuring a price is never negative).

---

## 3. Frontend Architecture Details

The React frontend utilizes a modular, feature-centric approach to support scalability.

### Folder Explanations:
- **`src/features/`**: For enterprise apps, grouping by feature (e.g., `features/authentication`, `features/pricing_dashboard`) is more scalable than grouping purely by file type. Each feature can contain its own components, hooks, and services.
- **`src/layouts/`**: Stores components that define the structure of a page (e.g., `AdminLayout` with a persistent sidebar and top navbar).
- **`src/pages/`**: These are the route components. A page is usually just a `Layout` wrapping several `Features` or `Components`.
- **`src/routes/`**: Centralizes the React Router configuration, defining which URL path maps to which `Page`.
- **`src/store/` & `src/context/`**: Manages data that needs to be accessed globally across many components (e.g., User Authentication state, Theme preferences).
- **`src/services/`**: Abstracts all external API calls. Instead of calling `axios.get` inside a component, a component calls `PricingService.getOptimizedPrice()`.

---

## 4. Machine Learning Structure

Machine Learning requires its own lifecycle management to ensure reproducibility and accurate evaluation.

### Folder Explanations:
- **`preprocessing/`**: Scripts to clean dirty data, handle missing values, and normalize features.
- **`feature_engineering/`**: Scripts to create new variables (e.g., moving averages of historical prices, competitor price ratios) that help the model learn better.
- **`training/`**: The scripts that feed data into algorithms to create a model. This tracks hyperparameters and training epochs.
- **`models/`**: The Python classes defining the architecture of the neural networks (LSTM) or tree models (XGBoost).
- **`evaluation/`**: Scripts to run test datasets against trained models to generate metrics (RMSE, MAE, R-squared).
- **`prediction/`**: The inference scripts. These take a trained model and new live data to output a price recommendation.
- **`saved_models/`**: The actual binary files (`.pkl`, `.joblib`) of the trained models, ready to be loaded by the backend API.

---

## 5. Documentation & 6. Testing Structure

### Documentation (`docs/`):
- **`Architecture/`**: Justifies *why* decisions were made (e.g., Why Postgres over MongoDB?).
- **`ER_Diagram/` & `Database_Design/`**: Visualizes how database tables relate to each other (Users -> Products -> Prices).
- **`Sequence_Diagrams/`**: Visualizes the flow of data (e.g., User clicks button -> API -> Service -> ML Model -> DB -> UI).
- **`Sprint_Notes/` & `Meeting_Notes/`**: Tracks Agile progress, blocking issues, and client requirements over the 8-week internship.

### Testing (`tests/`):
- **`backend_tests/`**: Unit tests verifying that individual Python functions work correctly.
- **`api_tests/`**: Tests verifying that hitting an endpoint (e.g., `/api/prices`) returns the correct JSON format and status codes.
- **`ml_model_tests/`**: Prevents "silent failures" in ML by ensuring that the models maintain a minimum accuracy threshold before being deployed.
- **`frontend_tests/`**: Ensures the UI renders correctly and user interactions (clicks, form submissions) behave as expected.

---

**This architecture ensures that PricePilot AI is robust, modular, and ready for a team of developers to collaborate efficiently.**
