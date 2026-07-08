from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.admin_service import admin_service

class AdminController:
    def create_admin_controller(self, request, admin_id: str, db: Session):
        try:
            admin = admin_service.create_admin(request, admin_id, db)
            return {
                "message": "Admin created successfully",
                "admin": {
                    "id": str(admin.id),
                    "name": admin.name,
                    "email": admin.email
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def change_university_status_controller(self, university_id: str, new_status: str, admin_id: str, db: Session):
        try:
            university = admin_service.change_university_status(university_id, new_status, admin_id, db)
            return {
                "message": f"University status updated to {new_status}",
                "university": {
                    "id": str(university.id),
                    "name": university.name,
                    "status": university.status,
                    "verification_file_url": university.verification_file_url
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    def get_universities_controller(self, db: Session):
        from datetime import datetime
        universities = admin_service.get_universities(db)
        return [
            {
                "id": str(u.id),
                "name": u.name,
                "contactEmail": u.contact_email,
                "country": u.country,
                "submittedDate": u.created_at.isoformat() if u.created_at else datetime.utcnow().isoformat(),
                "verificationFileUrl": u.verification_file_url,
                "status": u.status
            }
            for u in universities
        ]

    def login_admin_controller(self, request, db: Session):
        from helpers.security import verify_password, create_access_token
        admin = admin_service.login_admin(request.email, db)
        if not admin or not verify_password(request.password, admin.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
        token = create_access_token(data={"sub": str(admin.id), "role": "admin"})
        
        return {
            "token": token,
            "user": {
                "id": str(admin.id),
                "name": admin.name,
                "email": admin.email,
                "role": "admin"
            }
        }

    def verify_otp_controller(self, request, db: Session):
        from helpers.security import create_access_token
        admin = admin_service.get_admin_by_email(request.email, db)
        if not admin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
        
        if len(request.otp) != 6 or not request.otp.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP format")
        
        token = create_access_token(data={"sub": str(admin.id), "role": "admin"})
        
        return {
            "token": token,
            "user": {
                "id": str(admin.id),
                "name": admin.name,
                "email": admin.email,
                "role": "admin"
            }
        }

    def update_profile_controller(self, profile_req, admin, db: Session):
        updated_admin = admin_service.update_profile(admin, profile_req.name, profile_req.email, db)
        return {
            "id": str(updated_admin.id),
            "name": updated_admin.name,
            "email": updated_admin.email,
            "role": "admin"
        }

    def get_pending_regulations_controller(self, db: Session):
        from datetime import datetime
        import os
        results = admin_service.get_pending_regulations(db)
        submissions = []
        for r in results:
            if r.status.value == "active":
                status_str = "approved"
            elif r.status.value == "archived":
                status_str = "rejected"
            else:
                status_str = "pending"

            ext = "pdf"
            if r.document_name:
                _, ext = os.path.splitext(r.document_name)
                ext = ext.replace(".", "").lower()

            submissions.append({
                "id": str(r.id),
                "universityName": r.university_name,
                "documentName": r.document_name or "curriculum.pdf",
                "uploadDate": r.upload_date.isoformat() if r.upload_date else datetime.utcnow().isoformat(),
                "fileType": ext or "pdf",
                "fileUrl": r.file_path,
                "status": status_str,
                "rejectionReason": r.rejection_reason,
                "reviewedDate": r.reviewed_at.isoformat() if r.reviewed_at else None
            })
        return submissions

    def approve_regulation_controller(self, regulation_id: str, db: Session):
        try:
            admin_service.approve_regulation(regulation_id, db)
            return {"message": "Regulation approved successfully"}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    def reject_regulation_controller(self, regulation_id: str, reason: str, db: Session):
        try:
            admin_service.reject_regulation(regulation_id, reason, db)
            return {"message": "Regulation rejected successfully"}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

admin_controller = AdminController()
