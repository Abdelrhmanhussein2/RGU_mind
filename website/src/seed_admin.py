import asyncio
from helpers.config import SessionLocal, engine, Base
from models.admin_model import Admin
from helpers.security import hash_password
from sqlalchemy.orm import Session

def seed_superadmin():
    db: Session = SessionLocal()
    try:
        super_email = "superadmin@rgumind.com"
        existing = db.query(Admin).filter(Admin.email == super_email).first()
        if existing:
            print("Super Admin already exists!")
            return
        
        super_admin = Admin(
            name="Super Admin",
            email=super_email,
            password=hash_password("admin123"),
            is_super_admin=True
        )
        db.add(super_admin)
        db.commit()
        print("Super Admin created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables just in case
    Base.metadata.create_all(bind=engine)
    seed_superadmin()
