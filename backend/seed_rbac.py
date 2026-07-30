import os
import sys

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.core.security import get_password_hash

def seed_rbac():
    db = SessionLocal()
    
    try:
        print("Seeding Roles...")
        roles_data = ["Admin", "Pricing Manager", "Business Analyst", "Viewer"]
        roles = {}
        
        for r_name in roles_data:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name)
                db.add(role)
                db.commit()
                db.refresh(role)
            roles[r_name] = role
            
        print("Seeding Users...")
        users_data = [
            {"name": "Master Admin", "email": "mohammedsadiq4850@gmail.com", "role": "Admin"},
            {"name": "Alice Admin", "email": "admin@example.com", "role": "Admin"},
            {"name": "Peter Pricing", "email": "pricing@example.com", "role": "Pricing Manager"},
            {"name": "Bob Analyst", "email": "analyst@example.com", "role": "Business Analyst"},
            {"name": "Test Viewer", "email": "viewer@example.com", "role": "Viewer"}
        ]
        
        for u_data in users_data:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                hashed_pw = get_password_hash("Password123!")
                user = User(
                    full_name=u_data["name"],
                    email=u_data["email"],
                    password_hash=hashed_pw,
                    role_id=roles[u_data["role"]].id
                )
                db.add(user)
                db.commit()
                print(f"Created {u_data['role']} user: {u_data['email']}")
            else:
                # Ensure role is correct if user already existed
                user.role_id = roles[u_data["role"]].id
                db.commit()
                print(f"Updated {u_data['role']} user: {u_data['email']}")
                
        print("Success! You can now log in with these accounts.")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_rbac()
