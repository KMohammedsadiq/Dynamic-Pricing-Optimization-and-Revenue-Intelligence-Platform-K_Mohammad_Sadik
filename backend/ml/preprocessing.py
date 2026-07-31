import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

def prepare_training_data(filepath="backend/ml/data/retail_pricing_demand_100k.csv"):
    """
    Loads data, handles missing values, separates features/target, 
    and builds a preprocessing pipeline.
    
    Returns:
        X (pd.DataFrame): Raw features
        y (pd.Series): Target variable
        preprocessor (ColumnTransformer): Fitted preprocessor
        X_processed (np.ndarray): Transformed feature matrix
    """
    # 1. Load the dataset
    df = pd.read_csv(filepath)
    print(f"Original rows: {len(df)}")
    print(f"Original columns: {len(df.columns)}")
    
    # 2. Handle missing values
    df['promotion_type'] = df['promotion_type'].fillna("No Promotion")
    
    # 3. Verify no remaining missing values
    missing_count = df.isnull().sum().sum()
    print(f"Remaining missing values: {missing_count}")
    
    # Define features based on EDA report to prevent data leakage
    categorical_features = ['category', 'brand', 'region', 'channel', 'season', 'promotion_type']
    numerical_features = ['base_price', 'inventory_level', 'stockout_flag', 'demand_index']
    target = 'current_price'
    
    print("\nCategorical Features:", categorical_features)
    print("Numerical Features:", numerical_features)
    
    # 4. Separate dataset
    X = df[categorical_features + numerical_features]
    y = df[target]
    
    # 5. Build preprocessing pipeline
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
