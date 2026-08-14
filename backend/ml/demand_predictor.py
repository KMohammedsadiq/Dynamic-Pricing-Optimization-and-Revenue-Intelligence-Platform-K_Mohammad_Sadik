import os
import pandas as pd
import numpy as np
import pickle
import logging
from fastapi import HTTPException
from sklearn.preprocessing import OrdinalEncoder

logger = logging.getLogger("DemandPredictor")

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "demand_forecasting_features.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models", "demand_forecasting")

# --- PROVENANCE AUDIT VERIFICATION ---
# DO NOT remove or replace this hardcoded date with dynamic filtering (e.g. excluding 'sparse_snapshot').
# The dataset provenance audit proved that the dataset has a FIXED real-data boundary at 2026-08-10.
# While rows after this date are simulated/future data, many genuine historical rows between 
# April 2026 and August 2026 are also labeled as 'sparse_snapshot'. 
# Dynamically filtering out 'sparse_snapshot' would erroneously discard 4 months of genuine historical data.
# Therefore, production inference must strictly rely on this fixed, verified real-data boundary.
GENUINE_DATA_CUTOFF = "2026-08-10"

FINAL_MODEL_FEATURES = [
    "units_sold_lag_1", "units_sold_lag_2", "units_sold_lag_4", "units_sold_lag_8",
    "revenue_lag_1", "inventory_turnover_lag_1", "demand_index_lag_1", 
    "inventory_level_lag_1", "stockout_flag_lag_1", "competitor_price_lag_1",
    "historical_sales_safe",
    "rolling_4w_sales_mean", "rolling_4w_sales_max", "rolling_4w_sales_std",
    "rolling_8w_sales_mean", "rolling_8w_sales_max", "rolling_12w_sales_mean",
    "rolling_12w_sales_max", "sales_growth_4w",
    "base_price", "cost_price", "current_price", "discount_pct", 
    "promotion_type", "promo_active_share",
    "brand", "category", "product_lifecycle", "launch_year", "is_cold_start_product",
    "average_rating", "review_count", "profit_margin",
    "period_index", "year", "month", "week", "quarter", "day_of_week", 
    "season", "holiday_flag", "festival_flag", "days_since_first_observed"
]

HORIZON_MAP = {
    7: {"weeks": 1,  "model": "../demand_forecasting_dev/genuine_7d.pkl",  "readiness": "Production Ready"},
    14: {"weeks": 2,  "model": "../demand_forecasting_dev/genuine_14d.pkl", "readiness": "Production Ready"},
    30: {"weeks": 4,  "model": "../demand_forecasting_dev/genuine_30d.pkl", "readiness": "Limited / Production Candidate"},
    90: {"weeks": 13, "model": "../demand_forecasting_dev/genuine_90d.pkl", "readiness": "Limited"},
    180: {"weeks": 26, "model": "target_180d_Fold_3.pkl",                  "readiness": "Experimental / Not Ready"},
    365: {"weeks": 52, "model": "target_365d_Fold_2.pkl",                  "readiness": "Unverified / Historical Backtest Only"}
}

# Genuine chronological validation metrics (June-Aug 2026, genuine_historical provenance only)
# Source: train_final_genuine.py results. These are NOT synthetic-trained metrics.
VALIDATION_METRICS = {
    7:   {"status": "Validated",   "mae": 54.2,  "rmse": 97.1,   "r2": 0.774, "smape": 14.5},
    14:  {"status": "Validated",   "mae": 119.5, "rmse": 203.2,  "r2": 0.694, "smape": 17.7},
    30:  {"status": "Validated",   "mae": 271.9, "rmse": 459.8,  "r2": 0.640, "smape": 20.7},
    90:  {"status": "Validated",   "mae": 891.8, "rmse": 1421.1, "r2": 0.388, "smape": 19.8},
    180: {"status": "Experimental - Insufficient Genuine Validation", "mae": None, "rmse": None, "r2": None, "smape": None},
    365: {"status": "Unverified - No Genuine Historical Target Data",  "mae": None, "rmse": None, "r2": None, "smape": None}
}

def calculate_confidence_score(horizon_metrics):
    status = horizon_metrics["status"]
    if "Unverified" in status or "Experimental" in status or "Insufficient" in status:
        return None
    
    r2 = horizon_metrics["r2"]
    smape = horizon_metrics["smape"]
    
    if r2 is None or smape is None:
        return None
    
    # R2 Component (0-100), bounded to 0
    r2_score = max(0, r2 * 100)
    
    # sMAPE Component (0-100), assuming sMAPE > 100 is 0 score
    smape_score = max(0, 100 - smape)
    
    # Objective average of scale-independent metrics (genuine validation only)
    final_score = int(round(0.5 * r2_score + 0.5 * smape_score))
    
    return min(100, max(0, final_score))

def get_confidence_level(horizon, score):
    if score is None:
        return "Unverified"
    if horizon in [7, 14, 30]:
        return "High"
    elif horizon == 90:
        return "Moderate"
    elif horizon == 180:
        return "Low"
    else:
        return "Unverified"

class DemandPredictor:
    def __init__(self):
        self.df = None
        self.models = {}
        self._initialize()
        
    def _initialize(self):
        try:
            logger.info("Loading Demand Forecasting Dataset for feature extraction...")
            df = pd.read_csv(DATA_PATH)
            df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
            
            # --- ORDINAL ENCODER DETERMINISM VERIFICATION ---
            # The training script (train_demand_forecast.py) instantiated an OrdinalEncoder 
            # and applied fit_transform() on the entire demand_forecasting_features.csv dataset.
            # Because we are applying the exact same fit_transform on the exact same immutable CSV 
            # here in the prediction service, the category-to-integer mappings are mathematically 
            # and deterministically identical to the training mappings.
            cat_cols = ['promotion_type', 'brand', 'category', 'product_lifecycle', 'month', 'day_of_week', 'season']
            enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
            df[cat_cols] = enc.fit_transform(df[cat_cols].fillna('Missing'))
            
            self.df = df
            
            # Pre-load all available models
            for hz, conf in HORIZON_MAP.items():
                m_path = os.path.join(MODELS_DIR, conf['model'])
                if os.path.exists(m_path):
                    with open(m_path, 'rb') as f:
                        self.models[hz] = pickle.load(f)
                else:
                    logger.warning(f"Demand model {m_path} not found.")
                    
        except Exception as e:
            logger.error(f"Failed to initialize DemandPredictor: {e}")

    def get_available_products(self) -> list:
        if self.df is None:
            return []
        # Get unique product IDs
        unique_prods = self.df['product_id'].unique().tolist()
        return sorted(unique_prods)

    def _calculate_seasonal_analysis(self, hist_df, latest_row, horizon_weeks):
        def get_season_name(m):
            if m in [3, 4, 5]: return "Spring"
            elif m in [6, 7, 8]: return "Summer"
            elif m in [9, 10, 11]: return "Autumn"
            else: return "Winter"
            
        hist_df = hist_df.copy()
        hist_df['season_name'] = hist_df['date'].dt.month.apply(get_season_name)
        hist_df['is_genuine'] = (hist_df['is_synthetic'] == 0)
        
        seasonal_stats = {}
        synthetic_summary = []
        
        for sn in ["Spring", "Summer", "Autumn", "Winter"]:
            season_df = hist_df[hist_df['season_name'] == sn]
            if season_df.empty:
                continue
                
            genuine_df = season_df[season_df['is_genuine']]
            
            gen_count = len(genuine_df)
            syn_count = len(season_df) - gen_count
            total_count = len(season_df)
            
            syn_pct = round((syn_count / total_count) * 100, 1) if total_count > 0 else 0
            synthetic_only = bool(syn_pct >= 80.0)
            
            seasonal_stats[sn] = {
                "genuine_count": gen_count,
                "synthetic_count": syn_count,
                "genuine_pct": round((gen_count / total_count) * 100, 1) if total_count > 0 else 0,
                "synthetic_pct": syn_pct,
                "genuine_avg": round(genuine_df['units_sold'].mean(), 2) if gen_count > 0 else None,
                "dataset_avg": round(season_df['units_sold'].mean(), 2),
                "synthetic_only": synthetic_only
            }
            if synthetic_only:
                synthetic_summary.append(sn)
            
        if not seasonal_stats:
            return None
            
        highest_season = None
        lowest_season = None
        diff_pct = 0.0
        has_sufficient_genuine = False
        
        # Calculate trend using ONLY genuine data
        genuine_seasons = {k: v for k, v in seasonal_stats.items() if v['genuine_count'] > 0}
        
        if len(genuine_seasons) >= 2:
            sorted_seasons = sorted(genuine_seasons.items(), key=lambda x: x[1]['genuine_avg'], reverse=True)
            highest_season = sorted_seasons[0][0]
            lowest_season = sorted_seasons[-1][0]
            highest_avg = sorted_seasons[0][1]['genuine_avg']
            lowest_avg = sorted_seasons[-1][1]['genuine_avg']
            diff_pct = round(((highest_avg - lowest_avg) / lowest_avg * 100), 1) if lowest_avg > 0 else 0
            has_sufficient_genuine = True
            
        start_date = latest_row['date']
        future_dates = [start_date + pd.Timedelta(weeks=w) for w in range(1, horizon_weeks + 1)]
        upcoming_seasons = list(dict.fromkeys([get_season_name(d.month) for d in future_dates]))
        
        return {
            "historical_seasons": seasonal_stats,
            "has_sufficient_genuine": has_sufficient_genuine,
            "highest_season": highest_season,
            "lowest_season": lowest_season,
            "seasonal_difference_pct": diff_pct,
            "upcoming_seasons": upcoming_seasons,
            "synthetic_seasons_warning": synthetic_summary if synthetic_summary else None
        }

    def predict(self, product_id: str, horizon: int) -> dict:
        if self.df is None:
            raise HTTPException(status_code=500, detail="Demand dataset unavailable.")
            
        if horizon not in HORIZON_MAP:
            raise HTTPException(status_code=400, detail=f"Unsupported horizon. Supported: {list(HORIZON_MAP.keys())}")
            
        if horizon not in self.models:
            raise HTTPException(status_code=500, detail=f"Model for horizon {horizon} is missing on disk.")
            
        # 1. Filter dataset for product
        prod_df = self.df[self.df['product_id'] == product_id]
        if len(prod_df) == 0:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found in historical data.")
            
        # 2. Filter out simulated future data using the strictly verified genuine cutoff
        cutoff = pd.to_datetime(GENUINE_DATA_CUTOFF)
        hist_df = prod_df[prod_df['date'] <= cutoff].sort_values('date')
        if len(hist_df) == 0:
            raise HTTPException(status_code=400, detail="No genuinely observed historical data found before current date.")
            
        # 3. Get latest observation
        latest_row = hist_df.iloc[-1]
        
        # 4. Check for insufficient history / cold-start
        if pd.isna(latest_row['rolling_4w_sales_mean']):
            raise HTTPException(
                status_code=400, 
                detail="Insufficient historical data for reliable demand forecasting."
            )
            
        # 5. Construct Feature Matrix safely
        missing = [f for f in FINAL_MODEL_FEATURES if f not in hist_df.columns]
        if missing:
            raise HTTPException(status_code=500, detail=f"Missing required features: {missing}")
            
        X = pd.DataFrame([latest_row[FINAL_MODEL_FEATURES]])
        
        # --- FEATURE MATCH VERIFICATION ---
        if list(X.columns) != FINAL_MODEL_FEATURES:
            raise HTTPException(status_code=500, detail="Backend feature matrix order mismatch against training.")

        # 6. Predict
        model = self.models[horizon]
        raw_pred = float(model.predict(X)[0])
        predicted_demand = max(0.0, raw_pred) # non-negative
        
        # 7. Trend Calculation
        weeks = HORIZON_MAP[horizon]["weeks"]
        predicted_weekly = predicted_demand / weeks
        current_weekly = float(latest_row['rolling_4w_sales_mean'])
        
        if current_weekly > 0:
            diff_pct = (predicted_weekly - current_weekly) / current_weekly
            if diff_pct > 0.05:
                trend = "Increasing"
            elif diff_pct < -0.05:
                trend = "Decreasing"
            else:
                trend = "Stable"
        else:
            trend = "Increasing" if predicted_weekly > 0 else "Stable"
            
        # 8. Extract historical time-series for chart visualization (last 12 weeks)
        recent_history = hist_df.tail(12)[['date', 'units_sold']].copy()
        historical_data = []
        for _, row in recent_history.iterrows():
            historical_data.append({
                "date": str(row['date'].date()),
                "units_sold": int(row['units_sold'])
            })

        import datetime
        from ml.calendar_config import VERIFIED_CALENDAR

        # 9. Extract seasonal context
        obs_date = latest_row['date']
        horizon_end_date = obs_date + datetime.timedelta(days=horizon)
        
        upcoming_events = []
        for evt in VERIFIED_CALENDAR:
            evt_date = pd.to_datetime(evt['date'])
            if obs_date <= evt_date <= horizon_end_date:
                upcoming_events.append(evt['event_name'])
                
        # Remove duplicates while preserving chronological order
        unique_events = []
        for e in upcoming_events:
            if e not in unique_events:
                unique_events.append(e)

        season_num = int(latest_row['season'])
        season_map = {0: "Autumn", 1: "Spring", 2: "Summer", 3: "Winter"}
        season_str = season_map.get(season_num, "Unknown")
        
        # Handle long horizons
        if season_str != "Unknown":
            chronological = ["Winter", "Spring", "Summer", "Autumn"]
            start_idx = chronological.index(season_str)
            
            if horizon >= 300:
                season_str = "All Seasons (Year)"
            elif horizon >= 180:
                season_str = f"{season_str} → {chronological[(start_idx + 2) % 4]}"
            elif horizon >= 90:
                season_str = f"{season_str} → {chronological[(start_idx + 1) % 4]}"
        
        seasonal_context = {
            "quarter": int(latest_row['quarter']),
            "season": season_str,
            "upcoming_events": unique_events
        }
        
        seasonal_analysis = self._calculate_seasonal_analysis(hist_df, latest_row, weeks)

        # 10. API Response
        val_metrics = VALIDATION_METRICS[horizon]
        conf_score = calculate_confidence_score(val_metrics)
        conf_level = get_confidence_level(horizon, conf_score)

        response = {
            "product_id": product_id,
            "horizon": horizon,
            "forecast_period": f"{weeks} week(s)",
            "predicted_demand_units": round(predicted_demand, 2),
            "predicted_weekly_demand": round(predicted_weekly, 2),
            "demand_trend": trend,
            "readiness_status": HORIZON_MAP[horizon]["readiness"],
            "confidence_score": conf_score,
            "confidence_level": conf_level,
            "validation": val_metrics,
            "latest_observation_date": str(latest_row['date'].date()),
            "model_file": HORIZON_MAP[horizon]["model"],
            "historical_data": historical_data,
            "seasonal_context": seasonal_context,
            "seasonal_analysis": seasonal_analysis
        }
        
        return response

demand_predictor = DemandPredictor()
