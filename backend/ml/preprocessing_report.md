# PricePilot AI - Preprocessing Report

This document summarizes the results of the data preprocessing pipeline (Step 3). The historical dataset has been cleaned, filtered, and transformed into a machine-learning-ready feature matrix without any data leakage.

## 1. Dataset Dimensions
- **Original Rows**: 172,800
- **Original Columns**: 17

## 2. Missing Values Handled
- **`promotion_type`**: Successfully identified 100,155 missing values. Instead of dropping these rows (which would eliminate more than half of our dataset), we imputed them with the string `"No Promotion"`.
- **Remaining Missing Values**: 0

## 3. Feature Selection
Based on our EDA, we dropped non-predictive or leaky features (`revenue`, `units_sold`, `discount_pct`, `price_change_pct`, `product_id`, `date`) and retained the following robust inputs to predict `current_price`:

### Categorical Features (6)
1. `category`
2. `brand`
3. `region`
4. `channel`
5. `season`
6. `promotion_type`

### Numerical Features (4)
1. `base_price`
2. `inventory_level`
3. `stockout_flag`
4. `demand_index`

## 4. Encoding Strategy
A `ColumnTransformer` pipeline was built using `scikit-learn` to process the features simultaneously:
- **Categorical columns**: Passed through a `OneHotEncoder` (to convert text labels into binary 0/1 indicator columns).
- **Numerical columns**: Passed through unchanged for now (scaling will happen right before training the specific model).

## 5. Final Feature Matrix Shape
- **Final Rows**: 172,800
- **Final Columns (Features)**: 62

By applying One-Hot Encoding, our 6 categorical text features were successfully expanded into 58 distinct binary columns representing all unique categories (e.g., `brand_Nike`, `brand_Adidas`, `season_Winter`, etc.), resulting in exactly **62 total inputs** for the machine learning algorithms to train on.
