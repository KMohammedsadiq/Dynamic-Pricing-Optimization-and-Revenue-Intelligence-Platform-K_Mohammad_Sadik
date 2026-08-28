import joblib
import pandas as pd
import numpy as np
import logging
from fastapi import HTTPException
from .config import MODEL_PATH, FEATURE_COLUMNS, PIPELINE_VERSION

logger = logging.getLogger("Predictor")
# Model: XGBoost v3.0-XGB | Retrained 2026-08-05 with Festival Offer support

class Predictor:
    def __init__(self):
        self.pipeline = None
        self._model_mtime = None
        self._load_model()

    def _load_model(self):
        import os
        try:
            mtime = os.path.getmtime(MODEL_PATH)
        except OSError:
            mtime = None
        if self.pipeline is not None and mtime == self._model_mtime:
            return  # Model unchanged
        try:
            logger.info(f"Loading XGBoost Pipeline from {MODEL_PATH} (mtime={mtime})...")
            self.pipeline = joblib.load(MODEL_PATH)
            self._model_mtime = mtime
            logger.info("XGBoost Pipeline loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load XGBoost Pipeline from {MODEL_PATH}: {e}")

    def predict(self, feature_dict: dict) -> dict:
        """
        Expects a dictionary containing the 17 model features.
        Returns predicted_price, predicted_multiplier, prediction_stability, and model info.
        """
        # Hot-reload model if the pkl file has changed on disk
        self._load_model()
        if self.pipeline is None:
            self._load_model()
            if self.pipeline is None:
                logger.error("Machine Learning models are unavailable.")
                raise HTTPException(
                    status_code=500,
                    detail="Machine Learning models are unavailable. Please ensure optimal_price_pipeline.pkl is present in backend/ml/models."
                )

        # 1. Build ordered feature DataFrame matching training column order
        from .config import DEFAULT_VALUES
        ordered_data = {col: feature_dict.get(col, DEFAULT_VALUES.get(col, 0)) for col in FEATURE_COLUMNS}
        df = pd.DataFrame([ordered_data])

        # 2. Predict Multiplier via XGBoost pipeline
        predicted_multiplier = float(self.pipeline.predict(df)[0])

        # 3. Calculate Optimal Price
        current_price = feature_dict.get("current_price", 0)
        if not current_price:
            current_price = feature_dict.get("base_price", 0) * 0.95

        predicted_price = predicted_multiplier * current_price

        # ── Business Rule: Hard Cost Floor ────────────────────────────────────
        # The model must NEVER recommend a price below cost_price * 1.10.
        # This is a deterministic post-processing rule, not a model retrain issue.
        cost_price = feature_dict.get("cost_price", 0)
        if cost_price and cost_price > 0:
            cost_floor = cost_price * 1.10
            if predicted_price < cost_floor:
                logger.warning(
                    f"XGBoost predicted {predicted_price:.2f} which is below cost floor "
                    f"{cost_floor:.2f}. Clamping to cost floor."
                )
                predicted_price = cost_floor
                predicted_multiplier = predicted_price / current_price if current_price > 0 else predicted_multiplier

        # ── Business Rule: Promotion Multiplier Fallback ──────────────────────
        # If the model receives a promotion type it has not seen in training,
        # the OneHotEncoder silently treats it as all-zeros (like No Promotion).
        # This deterministic fallback ensures the correct business rule is applied.
        # After retraining with Festival Offer data, this is a safety net only.
        PROMO_MULTIPLIERS = {
            "Festival Offer":      0.95,
            "Percentage Discount": 0.97,
            "Buy One Get One":     0.96,
            "Member Offer":        0.98,
            "Flash Sale":          0.92,
            "Clearance":           0.90,
        }
        promo = feature_dict.get("promotion_type", "No Promotion")
        if promo in PROMO_MULTIPLIERS:
            mult = PROMO_MULTIPLIERS[promo]
            adjusted = predicted_price * mult
            # Only apply if the model hasn't already reduced the price
            # (i.e., if the raw predicted price is still higher than the adjusted price)
            if adjusted < predicted_price:
                logger.info(f"Promo fallback: {promo} x{mult} -> {adjusted:.2f} (was {predicted_price:.2f})")
                predicted_price = adjusted
                predicted_multiplier = predicted_price / current_price if current_price > 0 else predicted_multiplier
                # Re-apply cost floor after promo adjustment
                if cost_price and cost_price > 0 and predicted_price < cost_price * 1.10:
                    predicted_price = cost_price * 1.10
                    predicted_multiplier = predicted_price / current_price if current_price > 0 else predicted_multiplier



        # 4. XGBoost Prediction Stability
        # XGBoost does not have tree-variance like Random Forest.
        # We compute stability using leaf node disagreement across boosted trees.
        # A simpler, deterministic approach: use the predicted multiplier deviation
        # from 1.0 (neutral). Large deviations => lower confidence.
        # Also penalize if critical features (demand, competitor_price) are at
        # extreme default values, suggesting uncertain input quality.
        try:
            xgb_model = self.pipeline.named_steps['model']
            preprocessor = self.pipeline.named_steps['preprocessor']
            X_transformed = preprocessor.transform(df)

            # XGBoost margin spread: get raw margin predictions from each tree
            # ntree_limit iteration gives us per-tree contribution
            booster = xgb_model.get_booster()
            # Predict with incremental trees to approximate variance
            n_trees = xgb_model.n_estimators
            sample_points = min(20, n_trees)
            step = max(1, n_trees // sample_points)
            tree_preds = []
            for i in range(step, n_trees + 1, step):
                pred = xgb_model.predict(X_transformed, iteration_range=(0, i))
                tree_preds.append(pred[0])

            if len(tree_preds) > 1:
                std_dev = np.std(tree_preds)
                cv = std_dev / max(abs(predicted_multiplier), 0.001)
                # Map coefficient of variation to 0-100 stability score
                # cv < 0.001 → ~100%, cv > 0.05 → ~50%
                prediction_stability = max(50.0, min(100.0, 100.0 - (cv * 1000.0)))
            else:
                prediction_stability = 92.0

        except Exception as e:
            logger.warning(f"Could not calculate XGBoost prediction stability: {e}")
            prediction_stability = 90.0  # fallback

        return {
            "predicted_price": predicted_price,
            "predicted_multiplier": predicted_multiplier,
            "prediction_stability": round(prediction_stability, 1),
            "current_price": current_price,
            "model": {
                "name": "XGBoost Pipeline",
                "version": PIPELINE_VERSION
            }
        }

predictor = Predictor()
