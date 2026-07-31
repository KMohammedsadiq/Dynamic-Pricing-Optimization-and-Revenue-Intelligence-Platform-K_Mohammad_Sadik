import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'neww45179@gmail.com').first()
    if user:
        print(f"User: {user.email}, Role: '{user.role}'")
    else:
        print("User not found.")
except Exception as e:
    print(e)
finally:
    db.close()
