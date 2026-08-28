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

# Historical Read-Only Holiday Demand Impact Analysis
# DO NOT multiply forecasts by these numbers. They are for the reporting layer only.
HOLIDAY_INSIGHTS = {
    "Eid al-Fitr": {"change_pct": -1.9, "insufficient_data": False, "confounder_qualifier": None},
    "Holi": {"change_pct": 4.3, "insufficient_data": False, "confounder_qualifier": None},
    "Independence Day": {"change_pct": -39.3, "insufficient_data": False, "confounder_qualifier": "Interpretation is limited because promotional activity was higher during the event period."},
    "New Year": {"change_pct": 7.3, "insufficient_data": False, "confounder_qualifier": None},
    "Republic Day": {"change_pct": 3.2, "insufficient_data": False, "confounder_qualifier": None},
    "Diwali": {"change_pct": None, "insufficient_data": True, "confounder_qualifier": None},
    "Christmas": {"change_pct": None, "insufficient_data": True, "confounder_qualifier": None}
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
            
            # --- ORDINAL ENCODER ARTIFACT LOADING ---
            # Load the exact fitted OrdinalEncoder artifact generated during training
            # to ensure category-to-integer mappings are identical and safe from data drift.
            cat_cols = ['promotion_type', 'brand', 'category', 'product_lifecycle', 'month', 'day_of_week', 'season']
            
            encoder_path = os.path.join(MODELS_DIR, "../demand_forecasting_dev/demand_encoder.pkl")
            if not os.path.exists(encoder_path):
                raise FileNotFoundError(f"Missing encoder artifact: {encoder_path}")
                
            with open(encoder_path, 'rb') as f:
                enc = pickle.load(f)
                
            df[cat_cols] = enc.transform(df[cat_cols].fillna('Missing'))
            
            # Set index for faster lookups
            self.df = df.set_index('product_id', drop=False)
            
            
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
            
        import datetime
        start_date = pd.to_datetime(datetime.datetime.now().date())
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
            
        # 1. Filter dataset for product using indexed lookup
        try:
            prod_df = self.df.loc[[product_id]]
        except KeyError:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found in historical data.")
            
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
                "date": row['date'].strftime("%Y-%m-%d"),
                "units_sold": row['units_sold']
            })
            
        return {
            "predicted_demand": predicted_demand,
            "demand_trend": trend,
            "horizon_weeks": weeks,
            "seasonal_analysis": self._calculate_seasonal_analysis(hist_df, latest_row, weeks),
            "historical_chart_data": historical_data
        }

    def predict_batch_trend(self, horizon: int = 30) -> dict:
        """
        Fast batch inference to get the demand_trend for all products at once.
        Returns a dict: { product_id: 'Increasing' | 'Decreasing' | 'Stable' }
        """
        if self.df is None or horizon not in self.models:
            return {}
            
        cutoff = pd.to_datetime(GENUINE_DATA_CUTOFF)
        hist_df = self.df[self.df['date'] <= cutoff]
        
        if hist_df.empty:
            return {}
            
        # Get the latest row for each product
        # The index is already product_id, so we can just group by the index
        latest_df = hist_df.sort_values('date').groupby(level=0).last()
        
        # Filter products with sufficient data
        valid_df = latest_df[~latest_df['rolling_4w_sales_mean'].isna()]
        
        if valid_df.empty:
            return {}
            
        # Ensure all required features are present
        missing = [f for f in FINAL_MODEL_FEATURES if f not in valid_df.columns]
        if missing:
            return {}
            
        X = valid_df[FINAL_MODEL_FEATURES]
        
        model = self.models[horizon]
        try:
            preds = model.predict(X)
        except Exception:
            return {}
            
        weeks = HORIZON_MAP[horizon]["weeks"]
        predicted_weekly = np.maximum(0.0, preds) / weeks
        current_weekly = valid_df['rolling_4w_sales_mean'].values
        
        results = {}
        for i, pid in enumerate(valid_df.index):
            curr = current_weekly[i]
            pred = predicted_weekly[i]
            if curr > 0:
                diff_pct = (pred - curr) / curr
                if diff_pct > 0.05: trend = "Increasing"
                elif diff_pct < -0.05: trend = "Decreasing"
                else: trend = "Stable"
            else:
                trend = "Increasing" if pred > 0 else "Stable"
            results[pid] = trend
            
        return results

        import datetime
        from ml.calendar_config import VERIFIED_CALENDAR

        # 9. Extract seasonal context
        # Use real current date for event timeline checking instead of historical data cutoff
        real_today = pd.to_datetime(datetime.datetime.now().date())
        horizon_end_date = real_today + datetime.timedelta(days=horizon)
        
        upcoming_events = []
        for evt in VERIFIED_CALENDAR:
            evt_date = pd.to_datetime(evt['date'])
            if real_today <= evt_date <= horizon_end_date:
                upcoming_events.append({"name": evt['event_name'], "date": evt['date']})
                
        # Remove duplicates while preserving chronological order
        unique_events = []
        seen = set()
        for e in upcoming_events:
            if e['name'] not in seen:
                seen.add(e['name'])
                unique_events.append(e)

        real_month = real_today.month
        real_quarter = (real_month - 1) // 3 + 1
        
        def get_season_name_local(m):
            if m in [3, 4, 5]: return "Spring"
            elif m in [6, 7, 8]: return "Summer"
            elif m in [9, 10, 11]: return "Autumn"
            else: return "Winter"
            
        season_str = get_season_name_local(real_month)
        
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
            "quarter": real_quarter,
            "season": season_str,
            "upcoming_events": [e['name'] for e in unique_events]
        }
        
        seasonal_analysis = self._calculate_seasonal_analysis(hist_df, latest_row, weeks)

        # 10. API Response
        val_metrics = VALIDATION_METRICS[horizon]
        conf_score = calculate_confidence_score(val_metrics)
        conf_level = get_confidence_level(horizon, conf_score)

        # Calculate product-level insights
        holiday_insights_list = []
        genuine_hist_df = hist_df[hist_df['is_synthetic'] == 0]
        
        for ev_obj in unique_events:
            ev = ev_obj['name']
            ev_date = ev_obj['date']
            if ev in HOLIDAY_INSIGHTS:
                base_insight = dict(HOLIDAY_INSIGHTS[ev]) # copy
                base_insight['product_change_pct'] = None
                base_insight['upcoming_date'] = ev_date
                
                # Calculate product-specific uplift if it's not globally insufficient
                if not base_insight['insufficient_data'] and not genuine_hist_df.empty:
                    # Identify event name column
                    def _get_ev(row):
                        f = row.get('festival_name')
                        h = row.get('holiday_name')
                        if pd.notna(f) and str(f).strip() not in ['', 'None', 'nan']: return str(f).strip()
                        if pd.notna(h) and str(h).strip() not in ['', 'None', 'nan']: return str(h).strip()
                        return None
                    
                    ev_series = genuine_hist_df.apply(_get_ev, axis=1)
                    ev_df = genuine_hist_df[ev_series == ev]
                    ctrl_df = genuine_hist_df[ev_series.isna()]
                    
                    if not ev_df.empty and not ctrl_df.empty:
                        ev_mean = ev_df['units_sold'].mean()
                        ctrl_mean = ctrl_df['units_sold'].mean()
                        if ctrl_mean > 0:
                            base_insight['product_change_pct'] = round(((ev_mean - ctrl_mean) / ctrl_mean * 100), 1)
                            
                holiday_insights_list.append({
                    "event": ev,
                    "insight": base_insight
                })
        
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
            "seasonal_analysis": seasonal_analysis,
            "holiday_insights": holiday_insights_list
        }
        
        return response

demand_predictor = DemandPredictor()
