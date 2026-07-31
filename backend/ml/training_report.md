# PricePilot AI - Model Training Report (Version 1)

This document summarizes the execution and evaluation of our first baseline machine learning model (Step 4).

## 1. Dataset & Split Details
- **Total Dataset Size**: 172,800 records
- **Train/Test Split**: 80% Training / 20% Testing (random_state=42)
- **Features Used**: 62 total encoded features (originating from `base_price`, `inventory_level`, `stockout_flag`, `demand_index`, `category`, `brand`, `region`, `channel`, `season`, `promotion_type`)
- **Target Variable**: `current_price`

## 2. Model Configuration
- **Algorithm**: Linear Regression (`sklearn.linear_model.LinearRegression`)
- **Objective**: Establish a baseline predictive accuracy before experimenting with more complex tree-based algorithms.

## 3. Evaluation Metrics
The model was evaluated against the unseen 20% test set:
- **MAE (Mean Absolute Error)**: `15.6333`
- **RMSE (Root Mean Squared Error)**: `20.4319`
- **R² Score**: `0.9701`

### Observation
An R² score of 0.97 is exceptionally high for a baseline model, indicating that the features (particularly `base_price` and categorical multipliers like `promotion_type`) explain 97% of the variance in the target variable. A MAE of 15.6 means our predictions are off by an average of $15.60 / ₹15.60. 

## 4. Output Artifacts
The fitted model and its exact preprocessing pipeline have been successfully serialized for future API integration:
- **Trained Model**: `backend/ml/models/price_model.joblib`
- **Fitted Preprocessor**: `backend/ml/models/preprocessor.joblib`
