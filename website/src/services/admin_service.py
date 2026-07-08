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
        
        existing = db.query(Admin).filter(Admin.email == request.email.lower()).first()
        if existing:
            raise ValueError("Admin with this email already exists")

        new_admin = Admin(
            name=request.name,
            email=request.email.lower(),
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

    def get_universities(self, db: Session):
        return db.query(University).all()

    def login_admin(self, email: str, db: Session):
        return db.query(Admin).filter(Admin.email == email).first()

    def get_admin_by_email(self, email: str, db: Session):
        return db.query(Admin).filter(Admin.email == email).first()

    def update_profile(self, admin: Admin, name: str, email: str, db: Session):
        admin.name = name
        admin.email = email
        db.commit()
        db.refresh(admin)
        return admin

    def get_pending_regulations(self, db: Session):
        from models.regulation_model import Regulation
        from models.document_model import Document
        from models.department_model import Department
        from models.faculty_model import Faculty
        query = db.query(
            Regulation.id,
            University.name.label("university_name"),
            Document.filename.label("document_name"),
            Document.uploaded_at.label("upload_date"),
            Document.filename.label("file_type"),
            Document.file_path.label("file_path"),
            Regulation.status,
            Regulation.rejection_reason,
            Regulation.reviewed_at
        ).join(
            Department, Regulation.department_id == Department.id
        ).join(
            Faculty, Department.faculty_id == Faculty.id
        ).join(
            University, Faculty.university_id == University.id
        ).outerjoin(
            Document, Document.regulation_id == Regulation.id
        )
        return query.all()

    def approve_regulation(self, regulation_id: str, db: Session):
        from models.regulation_model import Regulation
        from datetime import datetime
        regulation = db.query(Regulation).filter(Regulation.id == regulation_id).first()
        if not regulation:
            raise ValueError("Regulation not found")

        regulation.status = "active"
        regulation.reviewed_at = datetime.utcnow()
        db.commit()

    def reject_regulation(self, regulation_id: str, reason: str, db: Session):
        from models.regulation_model import Regulation
        from datetime import datetime
        regulation = db.query(Regulation).filter(Regulation.id == regulation_id).first()
        if not regulation:
            raise ValueError("Regulation not found")

        regulation.status = "archived"
        regulation.rejection_reason = reason
        regulation.reviewed_at = datetime.utcnow()
        db.commit()

admin_service = AdminService()
