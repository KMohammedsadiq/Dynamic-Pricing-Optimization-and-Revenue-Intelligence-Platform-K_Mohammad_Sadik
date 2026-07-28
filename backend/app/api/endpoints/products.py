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

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading CSV file: {str(e)}"
        )

    total_rows_initial = len(df)

    # 1. Validate required columns exist
    expected_columns = [
        "product_id", "product_category_name", "month_year", "qty", "total_price", 
        "freight_price", "unit_price", "product_score", "customers", "weekday", 
        "weekend", "holiday", "month", "year", "s", "volume", 
        "comp_1", "comp_2", "comp_3", "lag_price"
    ]
    missing_cols = [col for col in expected_columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns in CSV: {', '.join(missing_cols)}"
        )

    # 2. Drop rows with missing critical information
    critical_cols = ["product_id", "product_category_name", "unit_price", "qty"]
    df = df.dropna(subset=critical_cols)
    
    # 3. Ensure numeric columns are actually numeric, coercing errors to NaN
    numeric_cols = ["unit_price", "qty", "freight_price", "total_price"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Drop rows that became NaN due to invalid numeric parsing
    df = df.dropna(subset=["unit_price", "qty"])
    
    # 4. Drop negative prices
    df = df[df["unit_price"] >= 0]

    # 5. Handle duplicate records
    df = df.drop_duplicates()

    # 6. Final Cleaning: Replace remaining NaN with None for SQLAlchemy compatibility
    df = df.where(pd.notnull(df), None)

    records = df.to_dict(orient="records")
    rows_imported = len(records)
    rows_skipped = total_rows_initial - rows_imported

    upload_status = "Success"

    if rows_imported > 0:
        try:
            # High-performance bulk insert
            db.execute(insert(Product), records)
            
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
from app.crud.crud_product import get_products, get_product
from app.api.deps import get_current_user_token

@router.get("")
def read_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
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
        category=category, sort_by=sort_by, sort_desc=sort_desc
    )
    
    # Return both the paginated data and the total count for the frontend pager
    return {
        "data": products,
        "total_count": total_count,
        "page": (skip // limit) + 1,
        "total_pages": math.ceil(total_count / limit) if limit > 0 else 1
    }

@router.get("/{id}")
def read_product(
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
