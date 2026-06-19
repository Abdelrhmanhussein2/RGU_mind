from sqlalchemy.orm import Session
from models.admin_model import Admin
from models.university_model import University
from helpers.security import hash_password
from fastapi import HTTPException

class AdminService:
    def create_admin(self, request, admin_id: str, db: Session):
        # Verify requester is super admin
        requester = db.query(Admin).filter(Admin.id == admin_id).first()
        if not requester or not requester.is_super_admin:
            raise PermissionError("Only Super Admin can create other admins")
        
        existing = db.query(Admin).filter(Admin.email == request.email).first()
        if existing:
            raise ValueError("Admin with this email already exists")

        new_admin = Admin(
            name=request.name,
            email=request.email,
            password=hash_password(request.password),
            is_super_admin=False
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        return new_admin

    def change_university_status(self, university_id: str, status: str, admin_id: str, db: Session):
        requester = db.query(Admin).filter(Admin.id == admin_id).first()
        if not requester:
            raise PermissionError("Not authorized")

        university = db.query(University).filter(University.id == university_id).first()
        if not university:
            raise ValueError("University not found")

        university.status = status
        db.commit()
        db.refresh(university)
        return university

admin_service = AdminService()
