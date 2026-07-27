from passlib.context import CryptContext

# 1. Initialize the CryptContext
# We configure Passlib to use the bcrypt algorithm.
# deprecated="auto" ensures that if we ever upgrade to a newer hashing algorithm 
# in the future, Passlib will automatically re-hash old passwords upon login.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Takes a raw password provided by the user (e.g., during login),
    hashes it, and compares it against the stored hash from the database.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Takes a raw password (e.g., during registration) and generates a 
    cryptographically secure, salted bcrypt hash to be stored in the database.
    """
    return pwd_context.hash(password)
