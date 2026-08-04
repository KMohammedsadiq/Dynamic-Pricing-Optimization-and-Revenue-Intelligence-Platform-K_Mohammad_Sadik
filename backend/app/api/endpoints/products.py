import pandas as pd
import io
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import insert
import math

from app.db.session import get_db
from app.api.deps import require_admin
from app.models.product import Product
from app.models.product_catalog import ProductCatalog
from app.models.dataset_upload import DatasetUpload

router = APIRouter()

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin)
):
    """
    Receives a CSV file, parses it with Pandas, rigidly validates the data,
    cleans it, and uses SQLAlchemy bulk insertion for enterprise-grade performance.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv files are allowed."
        )

    # We no longer block by filename. Instead, we use a smart anti-join below 
    # to only insert brand new rows from the CSV and ignore rows that already exist in the database!

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading CSV file: {str(e)}"
        )

    total_rows_initial = len(df)

    # 1. Detect Dataset Type and Validate Columns
    expected_old_columns = [
        "product_id", "product_category_name", "month_year", "qty", "total_price", 
        "freight_price", "unit_price", "product_score", "customers", "weekday", 
        "weekend", "holiday", "month", "year", "s", "volume", 
        "comp_1", "comp_2", "comp_3", "lag_price"
    ]
    
    expected_new_columns = [
        "date", "product_id", "category", "brand", "region", "channel", 
        "season", "base_price", "current_price", "price_change_pct", 
        "discount_pct", "promotion_type", "units_sold", "revenue", 
        "inventory_level", "stockout_flag", "demand_index"
    ]

    is_new_dataset = all(col in df.columns for col in ["brand", "current_price", "revenue"])
    
    if is_new_dataset:
        missing_cols = [col for col in expected_new_columns if col not in df.columns]
        critical_cols = ["product_id", "category", "current_price", "units_sold"]
        numeric_cols = ["current_price", "units_sold", "base_price", "revenue"]
        price_col = "current_price"
        qty_col = "units_sold"
    else:
        missing_cols = [col for col in expected_old_columns if col not in df.columns]
        critical_cols = ["product_id", "product_category_name", "unit_price", "qty"]
        numeric_cols = ["unit_price", "qty", "freight_price", "total_price"]
        price_col = "unit_price"
        qty_col = "qty"

    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns in CSV: {', '.join(missing_cols)}"
        )

    # 2. Drop rows with missing critical information
    df = df.dropna(subset=critical_cols)
    
    # 3. Ensure numeric columns are actually numeric, coercing errors to NaN
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Drop rows that became NaN due to invalid numeric parsing in critical cols
    df = df.dropna(subset=[price_col, qty_col])
    
    # 4. Drop negative prices
    df = df[df[price_col] >= 0]

    # 5. Handle duplicate records
    df = df.drop_duplicates()

    # 6. Smart Anti-Join to prevent duplicating records already in the database
    if is_new_dataset:
        # High-performance Core execution (bypasses slow ORM object creation)
        query = db.query(Product.product_id, Product.date, Product.region, Product.channel).statement
        existing_rows = db.execute(query).fetchall()
        df_existing = pd.DataFrame(existing_rows, columns=['product_id', 'date', 'region', 'channel'])
        
        if not df_existing.empty:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df_existing['date'] = pd.to_datetime(df_existing['date'], errors='coerce')
            
            # Drop timezone info if present to allow merging
            if df['date'].dt.tz is not None:
                df['date'] = df['date'].dt.tz_localize(None)
            if df_existing['date'].dt.tz is not None:
                df_existing['date'] = df_existing['date'].dt.tz_localize(None)
            
            # Merge and keep only new rows
            merged = df.merge(df_existing, on=['product_id', 'date', 'region', 'channel'], how='left', indicator=True)
            df = merged[merged['_merge'] == 'left_only'].drop(columns=['_merge'])

    # 7. Final Cleaning: Replace remaining NaN with None for SQLAlchemy compatibility
    # Cast to object first so pandas doesn't silently coerce None back into NaT for datetime columns
    df = df.astype(object).where(pd.notnull(df), None)

    records = df.to_dict(orient="records")
    rows_imported = len(records)
    rows_skipped = total_rows_initial - rows_imported

    upload_status = "Success"

    if rows_imported > 0:
        try:
            # High-performance bulk insert into Historical Data
            db.execute(insert(Product), records)
            
            # --- AUTO-SYNC TO CATALOG ---
            # Automatically create entries in the manual Product Catalog for brand new SKUs discovered in the CSV
            if is_new_dataset:
                # Extract unique products from the dataframe
                unique_products_df = df.drop_duplicates(subset=['product_id']).where(pd.notnull(df), None)
                unique_products = unique_products_df.to_dict(orient="records")
                
                # Fetch existing catalog SKUs
                existing_catalog = db.query(ProductCatalog.product_id).all()
                existing_skus = {row[0] for row in existing_catalog}
                
                new_catalog_entries = []
                for p in unique_products:
                    if p['product_id'] not in existing_skus:
                        new_catalog_entries.append({
                            "product_id": p['product_id'],
                            "product_name": p.get('product_name') or p['product_id'],
                            "category": p.get('category'),
                            "brand": p.get('brand'),
                            "base_price": float(p.get('base_price') or 0),
                            "current_price": float(p.get('current_price')) if pd.notnull(p.get('current_price')) else None,
                            "initial_inventory": int(p.get('inventory_level') or 0),
                            "status": "Active"
                        })
                
                if new_catalog_entries:
                    db.execute(insert(ProductCatalog), new_catalog_entries)
            
            # Record Audit Log
            audit_log = DatasetUpload(
                file_name=file.filename,
                uploaded_by=admin_user["user_id"],
                total_rows=total_rows_initial,
                imported_rows=rows_imported,
                skipped_rows=rows_skipped,
                status="Success"
            )
            db.add(audit_log)
            
            db.commit()
        except Exception as e:
            db.rollback()
            upload_status = "Failed"
            
            # Record Failed Audit Log
            try:
                failed_log = DatasetUpload(
                    file_name=file.filename,
                    uploaded_by=admin_user["user_id"],
                    total_rows=total_rows_initial,
                    imported_rows=0,
                    skipped_rows=total_rows_initial,
                    status="Failed: " + str(e)[:100]
                )
                db.add(failed_log)
                db.commit()
            except Exception as inner_e:
                db.rollback()
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database insertion failed: {str(e)}"
            )

    return {
        "status": upload_status,
        "file_name": file.filename,
        "total_rows": total_rows_initial,
        "rows_imported": rows_imported,
        "rows_skipped": rows_skipped,
        "upload_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

from typing import Optional
from app.crud.crud_product import get_products, get_product, create_product, update_product, soft_delete_product
from app.api.deps import get_current_user_token
from app.schemas.product_catalog import ProductCatalogCreate, ProductCatalogUpdate, ProductCatalogOut

@router.get("")
def read_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_token)
):
    """
    Retrieve products with support for pagination, search, filter, and sorting.
    """
    products, total_count = get_products(
        db, skip=skip, limit=limit, search=search, 
        category=category, brand=brand, status=status, 
        sort_by=sort_by, sort_desc=sort_desc
    )
    
    # Return both the paginated data and the total count for the frontend pager
    return {
        "data": products,
        "total_count": total_count,
        "page": (skip // limit) + 1,
        "total_pages": math.ceil(total_count / limit) if limit > 0 else 1
    }

@router.post("", response_model=ProductCatalogOut)
def create_new_product(
    product_in: ProductCatalogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Create a new product. Only accessible by Admins.
    """
    from sqlalchemy.exc import IntegrityError
    try:
        return create_product(db=db, product_in=product_in)
    except IntegrityError:
        db.rollback()
        sku = product_in.product_id or "Auto-generated"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"A product with SKU '{sku}' already exists."
        )

@router.get("/{id}", response_model=ProductCatalogOut)
def read_product_by_id(
    id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_token)
):
    """
    Retrieve a specific product by its internal database ID.
    """
    product = get_product(db, product_id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{id}", response_model=ProductCatalogOut)
def update_existing_product(
    id: int,
    product_in: ProductCatalogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Update an existing product. Only accessible by Admins.
    """
    product = get_product(db, product_id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return update_product(db=db, db_obj=product, product_in=product_in)

@router.delete("/{id}", response_model=ProductCatalogOut)
def delete_existing_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Soft delete a product by its ID. Only accessible by Admins.
    """
    product = get_product(db, product_id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return soft_delete_product(db=db, db_obj=product)
