import os
import sys

# Add the project root to sys.path so that backend modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.ml.demand_predictor import demand_predictor

print("Testing DemandPredictor End-to-End")

horizons = [7, 14, 30, 90, 180, 365]
test_product = 'ACC001'
test_product_high = 'BOK501'

def test_product_pred(pid):
    print(f"\nTesting product: {pid}")
    for hz in horizons:
        try:
            res = demand_predictor.predict(pid, hz)
            print(f"Horizon {hz}d:")
            print(f"  Prediction Returned: Yes")
            print(f"  Demand >= 0: {res['predicted_demand_units'] >= 0} ({res['predicted_demand_units']})")
            
            # Note: For 7d, weeks=1. For 14d, weeks=2, etc.
            weeks = int(res['forecast_period'].split()[0])
            norm = round(res['predicted_demand_units'] / weeks, 2)
            print(f"  Weekly Normalization Correct: {res['predicted_weekly_demand'] == norm} ({res['predicted_weekly_demand']})")
            print(f"  Trend: {res['demand_trend']}")
            print(f"  Readiness: {res['readiness_status']}")
            print(f"  Has Validation: {'mae' in res['validation']}")
            print(f"  Model File: {res['model_file']}")
        except Exception as e:
            print(f"  ERROR on Horizon {hz}: {e}")

test_product_pred(test_product)
test_product_pred(test_product_high)
