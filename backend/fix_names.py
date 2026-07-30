from app.db.session import SessionLocal
from app.models.user import User

def fix_names():
    db = SessionLocal()
    try:
        master_admin = db.query(User).filter(User.email == "mohammedsadiq4850@gmail.com").first()
        if master_admin:
            master_admin.full_name = "Master Admin"
            print("Updated Master Admin")
            
        alice_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if alice_admin:
            alice_admin.full_name = "Alice Admin"
            print("Updated Alice Admin")
            
        db.commit()
        print("Done fixing names!")
    finally:
        db.close()

if __name__ == "__main__":
    fix_names()
