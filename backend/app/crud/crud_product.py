from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.product_catalog import ProductCatalog
from app.schemas.product_catalog import ProductCatalogCreate, ProductCatalogUpdate

def get_products(
    db: Session, 
    skip: int = 0, 
    limit: int = 20, 
    search: str = None, 
    category: str = None,
    brand: str = None,
    status: str = None,
    sort_by: str = None,
    sort_desc: bool = False
):
    # Only return non-deleted products (treating NULL as False)
    query = db.query(ProductCatalog).filter(
        or_(ProductCatalog.is_deleted == False, ProductCatalog.is_deleted.is_(None))
    )

    # 1. Search Logic
    if search:
        query = query.filter(
            or_(
                ProductCatalog.product_name.ilike(f"%{search}%"),
                ProductCatalog.category.ilike(f"%{search}%"),
                ProductCatalog.brand.ilike(f"%{search}%")
            )
        )

    # 2. Filter Logic
    if category:
        query = query.filter(ProductCatalog.category == category)
    if brand:
        query = query.filter(ProductCatalog.brand == brand)
    if status:
        query = query.filter(ProductCatalog.status == status)

    # 3. Sort Logic
    if sort_by:
        sort_column = getattr(ProductCatalog, sort_by, None)
        if sort_column is not None:
            if sort_desc:
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(ProductCatalog.id)

    # 4. Pagination Logic
    total_count = query.count()
    products = query.offset(skip).limit(limit).all()

    return products, total_count


def get_product(db: Session, product_id: int):
    return db.query(ProductCatalog).filter(
        ProductCatalog.id == product_id,
        or_(ProductCatalog.is_deleted == False, ProductCatalog.is_deleted.is_(None))
    ).first()


def create_product(db: Session, product_in: ProductCatalogCreate):
    import random
    import string
    
    product_data = product_in.dict(exclude_unset=True)
    
    # Generate SKU if not provided
    if "product_id" not in product_data or not product_data["product_id"]:
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        product_data["product_id"] = f"SKU-{random_suffix}"
        
    db_obj = ProductCatalog(**product_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_product(db: Session, db_obj: ProductCatalog, product_in: ProductCatalogUpdate):
    update_data = product_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def soft_delete_product(db: Session, db_obj: ProductCatalog):
    db_obj.is_deleted = True
    db_obj.status = "Inactive"
    db.commit()
    db.refresh(db_obj)
    return db_obj
