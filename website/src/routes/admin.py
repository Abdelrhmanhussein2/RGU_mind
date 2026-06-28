import os
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_admin, verify_password, create_access_token
from models.admin_model import Admin
from models.regulation_model import Regulation
from models.document_model import Document
from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department
from schemes.admin_schemes import (
    AdminCreateRequest,
    AdminLoginRequest,
    AdminOtpVerifyRequest,
    AdminProfileUpdateRequest,
    AdminRejectRegulationRequest
)
from controllers.admin_controller import admin_controller

admin_router = APIRouter()


@admin_router.post("/create-admin")
async def create_admin(
    request: AdminCreateRequest, 
    x_admin_id: str = Header(..., description="The ID of the requester (must be a super admin)"), 
    db: Session = Depends(get_db)
):
    return admin_controller.create_admin_controller(request, x_admin_id, db)


@admin_router.post("/approve-university/{university_id}")
async def approve_university(
    university_id: str, 
    x_admin_id: str = Header(None, description="The ID of the admin"), 
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin_id = x_admin_id or str(admin.id)
    return admin_controller.change_university_status_controller(university_id, "approved", admin_id, db)


@admin_router.post("/reject-university/{university_id}")
async def reject_university(
    university_id: str, 
    x_admin_id: str = Header(None, description="The ID of the admin"), 
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin_id = x_admin_id or str(admin.id)
    return admin_controller.change_university_status_controller(university_id, "rejected", admin_id, db)


@admin_router.get("/universities")
async def get_universities(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    universities = db.query(University).all()
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



# --- New Admin Auth Endpoints ---

@admin_router.post("/auth/login")
async def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == request.email).first()
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


@admin_router.post("/auth/verify-otp")
async def admin_verify_otp(request: AdminOtpVerifyRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    
    # Accepts any 6 digit code as per specification guidelines
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


# --- New Admin Settings / Profile Endpoint ---

@admin_router.put("/profile")
async def update_admin_profile(
    profile_req: AdminProfileUpdateRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin.name = profile_req.name
    admin.email = profile_req.email
    db.commit()
    db.refresh(admin)
    return {
        "id": str(admin.id),
        "name": admin.name,
        "email": admin.email,
        "role": "admin"
    }


# --- New Admin Regulations Submission Dashboard Endpoints ---

@admin_router.get("/regulations/pending")
async def get_pending_regulations(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Query all regulations and join their university context
    # Note: Regulation -> Department -> Faculty -> University
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

    results = query.all()
    submissions = []
    for r in results:
        # Determine status string
        if r.status.value == "active":
            status_str = "approved"
        elif r.status.value == "archived":
            status_str = "rejected"
        else:
            status_str = "pending"

        # Determine file type extension
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


@admin_router.post("/regulations/{regulation_id}/approve")
async def approve_regulation(
    regulation_id: UUID,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    regulation = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not regulation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regulation not found")

    regulation.status = "active"
    regulation.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "Regulation approved successfully"}


@admin_router.post("/regulations/{regulation_id}/reject")
async def reject_regulation(
    regulation_id: UUID,
    reject_req: AdminRejectRegulationRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    regulation = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not regulation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regulation not found")

    regulation.status = "archived"
    regulation.rejection_reason = reject_req.reason
    regulation.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "Regulation rejected successfully"}
