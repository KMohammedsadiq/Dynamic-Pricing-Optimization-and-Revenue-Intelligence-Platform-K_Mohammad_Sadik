# PricePilot AI — Deployment Readiness Assessment

## 1. Current Architecture
The project is a full-stack web application consisting of:
- **Frontend**: React SPA built with Vite and styled with Tailwind CSS.
- **Backend**: FastAPI web service managed by Uvicorn.
- **Database**: PostgreSQL database accessed via SQLAlchemy ORM.
- **Machine Learning**: Integrated inference engine using pre-trained XGBoost and Random Forest models for price optimization and demand forecasting, loaded from `.pkl` files.

## 2. Frontend Readiness
- **Build System**: Vite is correctly configured (`vite.config.js`). The production build runs successfully (`npx vite build` completes in ~1s and generates the `dist/` output).
- **Environment Variables**: API URLs are handled via `import.meta.env.VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000/api/v1` in `api.js`.
- **Static Hosting**: The compiled `dist/` directory is entirely static HTML/JS/CSS and can be served by any CDN or static hosting provider.

## 3. Backend Readiness
- **Framework & Server**: Uses FastAPI with Uvicorn.
- **Dependencies**: Fully specified in `requirements.txt` (FastAPI, SQLAlchemy, scikit-learn, XGBoost, pandas, psycopg2-binary, etc.).
- **Path Handling**: Internal file dependencies (like ML models and CSV datasets) use `os.path.join(os.path.dirname(__file__), ...)` which ensures cross-platform compatibility and resolves correctly inside a Linux container.
- **CORS Configuration**: Open (`allow_origins=["*"]`), which is perfectly functional (though permissive) for deployment.

## 4. Database Readiness
- **RDBMS Engine**: PostgreSQL is explicitly required (`psycopg2-binary`).
- **Connection Configuration**: Managed dynamically via the `DATABASE_URL` environment variable read by Pydantic `BaseSettings`.
- **Initialization**: Alembic is configured for migrations, and seed scripts exist (`sync_db_with_dataset.py`, `populate_marketplace_metadata.py`).
- **Statefulness**: Requires persistent storage. The production environment must provision a dedicated PostgreSQL instance.

## 5. ML Model Readiness
- **Model Storage**: All inference models are saved as lightweight pickled artifacts (`.pkl`).
- **Pricing Model**: `optimal_price_pipeline.pkl` is ~2.4MB.
- **Demand Models**: Horizon-specific models (`genuine_7d.pkl`, `genuine_14d.pkl`, etc.) are ~500KB each. Total footprint is well under 20MB.
- **Datasets**: `demand_forecasting_features.csv` is loaded at runtime.
- **Verdict**: The models are small enough to be bundled directly into the backend deployment container/package without needing external object storage (like AWS S3).

## 6. External Service Dependencies
The application integrates with multiple third-party APIs for live market intelligence:
- **RapidAPI** (Amazon and Flipkart real-time endpoints)
- **SerpApi** (Google Shopping scraping)
- **Gemini API**
- **ZenRows API & ScrapingDog API**

These require valid API keys to function in production. The backend gracefully handles timeouts/errors, but core competitor sync features will fail if keys are omitted.

## 7. Environment Variable Requirements
To deploy, the following variables must be configured on the host/container:

**Frontend (Build Time):**
- `VITE_API_BASE_URL` (Must be set to the live backend URL, e.g., `https://api.pricepilot.com/api/v1`)

**Backend (Runtime):**
- `DATABASE_URL` (Production PostgreSQL connection string)
- `ENVIRONMENT` (Set to `production`)
- `SECRET_KEY` (Strong cryptographic key for JWTs)
- `RAPID_API_KEY`, `SERPAPI_API_KEY`, `GEMINI_API_KEY`, `ZENROWS_API_KEY`, `SCRAPINGDOG_API_KEY`

## 8. Security Readiness
- **JWT Secrets**: `SECRET_KEY` has a hardcoded default in `.env`. ⚠️ **REQUIRES CHANGE** (Must use a secure injection in production).
- **Database Credentials**: Hardcoded `postgres:root@localhost` in `.env`. ⚠️ **REQUIRES CHANGE**.
- **Debug Mode**: FastAPI is initialized with `debug=True` in `main.py`. ⚠️ **REQUIRES CHANGE** (Must be `False` for production to prevent stack trace leaks).
- **CORS**: `allow_origins=["*"]`. ⚠️ **REQUIRES CONFIGURATION** (Acceptable for an internship demo, but should ideally be locked down to the frontend domain).

## 9. Docker Feasibility
✅ **FEASIBLE**
The backend already includes a valid `Dockerfile` based on `python:3.11-slim`. It correctly installs system prerequisites (`libpq-dev`, `build-essential`) and Python dependencies, then exposes port 8000. It is fully ready to be containerized.

## 10. Cloud Deployment Options
- **Render**: Extremely well-suited. Provides Native Web Services (backend), Static Sites (frontend), and Managed PostgreSQL out of the box with zero DevOps overhead.
- **Railway**: Excellent alternative with similar ease of use, offering a unified canvas for Postgres, Docker backend, and static frontend.
- **AWS (EC2 / ECS / RDS)**: Overkill. Too much infrastructure overhead (VPCs, ALB, IAM) for an internship project/demo.
- **Vercel / Netlify**: Perfect for the frontend, but cannot run the FastAPI backend (as it requires a long-running process for ML inference and DB pooling, not just serverless functions).

## 11. Recommended Deployment Architecture
**Render** is the recommended platform due to simplicity, unified billing/management, and robust free/hobby tiers suitable for an internship demonstration.

1. **Frontend**: Render Static Site (Vite build command `npm run build`, publish directory `dist`).
2. **Backend**: Render Web Service (using the existing Dockerfile or native Python environment).
3. **Database**: Render Managed PostgreSQL (backend connects via internal network).

## 12. Deployment Blockers
❌ **BLOCKER**: The frontend `VITE_API_BASE_URL` falls back to `http://127.0.0.1:8000/api/v1`. This will cause the deployed frontend to attempt to connect to the user's local machine instead of the cloud backend.
❌ **BLOCKER**: `debug=True` is hardcoded in `backend/main.py`.

## 13. Required Changes Before Deployment
1. Update `backend/main.py` to disable `debug=True` or bind it to the `ENVIRONMENT` setting.
2. Configure the deployment CI/CD pipeline to inject the correct `VITE_API_BASE_URL` during the frontend build step.
3. Provision a production PostgreSQL database and run the Alembic migrations / seed scripts (`sync_db_with_dataset.py`) against it.
4. Replace `.env` defaults with secure secrets in the cloud provider's environment variable manager.

## 14. Deployment Readiness Verdict
⚠️ **REQUIRES CONFIGURATION**

The project is structurally excellent and highly container-friendly. The ML models are correctly bundled, and file paths are OS-agnostic. Once the environment variables (especially the frontend API URL) and debug flags are properly configured for production, the application can be seamlessly deployed to a PaaS provider like Render.
