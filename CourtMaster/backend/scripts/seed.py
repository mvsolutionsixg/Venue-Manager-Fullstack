from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import get_password_hash

def seed():
    db = SessionLocal()
    
    # Check if we have users
    user = db.query(User).filter(User.username == "admin").first()
    if not user:
        print("Creating admin user...")
        hashed = get_password_hash("admin123")
        user = User(username="admin", password_hash=hashed)
        db.add(user)
        db.commit()
    else:
        print("Admin user already exists.")
        
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
