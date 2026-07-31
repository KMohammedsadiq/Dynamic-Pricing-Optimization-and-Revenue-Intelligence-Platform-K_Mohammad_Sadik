# PricePilot AI - Machine Learning Module

This directory isolates the Machine Learning pipeline from the core FastAPI application. It follows a clean architecture model, ensuring that model training, data engineering, and inference logic are completely decoupled from the web layer.

## 📂 Folder Structure

- `data/`: Contains the raw historical datasets (e.g., `retail_pricing_demand_100k.csv`) and any intermediate processed data.
- `models/`: Stores serialized, trained model artifacts (e.g., `.pkl`, `.joblib`) ready for inference.
- `notebooks/`: Jupyter notebooks used for exploratory data analysis (EDA), prototyping, and experimentation.

## 📄 File Responsibilities

- **`preprocessing.py`**: Handles loading raw data, cleaning, missing value imputation, outlier removal, and standardizing data formats.
- **`feature_engineering.py`**: Transforms cleaned data into model-ready features (e.g., encoding categories, generating time-series lags, scaling).
- **`train_price_model.py`**: The primary pipeline script. It splits the data, trains the chosen ML algorithms (starting with Linear Regression as a baseline), performs hyperparameter tuning, and saves the final model to `models/`.
- **`predict.py`**: The inference engine. It loads a serialized model from `models/`, applies the exact same preprocessing/feature engineering to new incoming data, and returns predictions (e.g., optimal price, demand forecast).
- **`evaluate_model.py`**: Calculates metrics (RMSE, MAE) and generates visualizations to validate model performance before deployment.
- **`utils.py`**: Shared helper functions for logging, configuration management, and I/O operations (saving/loading models).

## 🚀 Future Workflows

### 1. Training Pipeline
1. Execute `train_price_model.py`.
2. Internally, it calls `preprocessing.py` to clean the data from `data/`.
3. It passes the clean data to `feature_engineering.py` to extract features.
4. The model is trained, evaluated using `evaluate_model.py`, and saved to the `models/` directory.

### 2. Prediction Pipeline (API Integration)
1. The FastAPI endpoints in `backend/app/api/endpoints/` receive a prediction request.
2. The endpoint passes the raw JSON payload to `predict.py`.
3. `predict.py` cleans and engineers features for that single instance, loads the active model, and returns the calculated prediction.
4. FastAPI returns the JSON response to the frontend.
