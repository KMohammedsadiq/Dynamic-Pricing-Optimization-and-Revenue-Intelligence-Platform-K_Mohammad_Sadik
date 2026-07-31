import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

def prepare_training_data(filepath="backend/ml/data/final_retail_pricing_demand_inr_clean.csv.xlsx"):
    """
    Loads the INR-native dataset, handles missing values, separates features/target,
    and builds a preprocessing pipeline.

    Dataset: Trained directly on INR values — no currency conversion required.

    Returns:
        X (pd.DataFrame): Raw features
        y (pd.Series): Target variable
        preprocessor (ColumnTransformer): Fitted preprocessor
        X_processed (np.ndarray): Transformed feature matrix
    """
    # 1. Load the dataset (Excel format)
    df = pd.read_excel(filepath)
    print(f"Original rows: {len(df)}")
    print(f"Original columns: {len(df.columns)}")

    # 2. Normalize column name: new dataset uses 'sales_channel', model expects 'channel'
    if 'sales_channel' in df.columns and 'channel' not in df.columns:
        df.rename(columns={'sales_channel': 'channel'}, inplace=True)

    # 3. Handle missing values
    df['promotion_type'] = df['promotion_type'].fillna("No Promotion")

    # 4. Verify no remaining missing values in key columns
    missing_count = df.isnull().sum().sum()
    print(f"Remaining missing values: {missing_count}")

    # Define features to prevent data leakage
    categorical_features = ['category', 'brand', 'region', 'channel', 'season', 'promotion_type']
    numerical_features = ['base_price', 'inventory_level', 'stockout_flag', 'demand_index']
    target = 'current_price'

    print("\nCategorical Features:", categorical_features)
    print("Numerical Features:", numerical_features)

    # 5. Separate dataset
    X = df[categorical_features + numerical_features]
    y = df[target]

    # 6. Build preprocessing pipeline
    # OneHotEncoder for categorical, passthrough for numerical
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_features),
            ('num', 'passthrough', numerical_features)
        ]
    )

    # Fit and transform to get final dimensions
    X_processed = preprocessor.fit_transform(X)

    print(f"\nFinal feature matrix dimensions: {X_processed.shape}")

    return X, y, preprocessor, X_processed

if __name__ == "__main__":
    prepare_training_data()
