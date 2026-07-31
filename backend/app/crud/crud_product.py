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
    # Only return non-deleted products
    query = db.query(ProductCatalog).filter(ProductCatalog.is_deleted == False)

    # 1. Search Logic
    if search:
        query = query.filter(
            or_(
                ProductCatalog.product_id.ilike(f"%{search}%"),
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
        ProductCatalog.is_deleted == False
    ).first()


def create_product(db: Session, product_in: ProductCatalogCreate):
    import random
    import string
    
    # Generate SKU if not provided
    sku = product_in.product_id
    if not sku:
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        sku = f"SKU-{random_suffix}"
        
    db_obj = ProductCatalog(
        product_id=sku,
        product_name=product_in.product_name,
        category=product_in.category,
        brand=product_in.brand,
        description=product_in.description,
        base_price=product_in.base_price,
        cost_price=product_in.cost_price,
        initial_inventory=product_in.initial_inventory,
        status=product_in.status
    )
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
