from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from app.models.product import Product

def get_products(
    db: Session, 
    skip: int = 0, 
    limit: int = 20, 
    search: str = None, 
    category: str = None,
    sort_by: str = None,
    sort_desc: bool = False
):
    query = db.query(Product)

    # 1. Search Logic
    if search:
        # Search by product_id OR category_name using ILIKE for case-insensitive matching
        query = query.filter(
            or_(
                Product.product_id.ilike(f"%{search}%"),
                Product.product_category_name.ilike(f"%{search}%")
            )
        )

    # 2. Filter Logic
    if category:
        query = query.filter(Product.product_category_name == category)

    # 3. Sort Logic
    if sort_by:
        # Map frontend string to actual SQLAlchemy model column
        sort_column = getattr(Product, sort_by, None)
        if sort_column is not None:
            if sort_desc:
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
    else:
        # Default sort by id to ensure stable pagination
        query = query.order_by(Product.id)

    # 4. Pagination Logic
    total_count = query.count()
    products = query.offset(skip).limit(limit).all()

    return products, total_count


def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()
