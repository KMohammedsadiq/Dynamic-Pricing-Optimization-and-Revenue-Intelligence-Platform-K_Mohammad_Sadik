from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. Create the SQLAlchemy Engine
# The engine is the core interface to the database. It manages the connection pool.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True, # Tests the connection for liveness before using it
)

# 2. Create the SessionLocal class
# Each instance of this class will be an actual database session (transaction).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base class
# All of our database models (tables) will inherit from this Base class.
Base = declarative_base()

# 4. Dependency to get the DB session
# This generator function ensures that a database connection is opened for a request
# and cleanly closed when the request finishes, even if an error occurs.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
