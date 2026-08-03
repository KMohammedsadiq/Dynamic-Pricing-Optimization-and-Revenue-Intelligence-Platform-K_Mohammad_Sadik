import os
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

def prepare_training_data(filepath=None):
    """
    Loads the final dataset, applies an approved allowlist for business features,
    dynamically categorizes numerical/categorical columns, and builds a preprocessing pipeline.
    """
    if filepath is None:
        filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "retail_price_optimization_dataset.csv")
    
    # 1. Load the dataset
    df = pd.read_csv(filepath)
    print(f"Original rows: {len(df)}")
    print(f"Original columns: {len(df.columns)}")

    # 2. Normalize column name for consistency
    if 'sales_channel' in df.columns and 'channel' not in df.columns:
        df.rename(columns={'sales_channel': 'channel'}, inplace=True)

    # 3. Handle missing values for certain string columns if any
    if 'promotion_type' in df.columns:
        df['promotion_type'] = df['promotion_type'].fillna("No Promotion")
        
    df.fillna(0, inplace=True) # Fallback for any unexpected nulls to guarantee no errors

    # 4. Define explicitly allowed features (Approved Business Features)
    allowed_features = [
        'product_name', 'brand', 'category', 'base_price', 'cost_price',
        'competitor_price', 'demand_index', 'inventory_level', 'promotion_type',
        'season', 'historical_sales', 'average_rating', 'product_lifecycle'
    ]
    target = 'current_price'

    # 5. Filter features based on allowlist and existence in dataframe
    available_features = [f for f in allowed_features if f in df.columns]

    # 6. Dynamically separate into categorical and numerical based on dtypes
    categorical_features = df[available_features].select_dtypes(include=['object', 'string']).columns.tolist()
    numerical_features = df[available_features].select_dtypes(include=['int64', 'float64']).columns.tolist()

    print("\nTarget:", target)
    print("Categorical Features:", categorical_features)
    print("Numerical Features:", numerical_features)

    # 7. Separate dataset
    X = df[categorical_features + numerical_features]
    y = df[target]

    # 8. Build preprocessing pipeline
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
