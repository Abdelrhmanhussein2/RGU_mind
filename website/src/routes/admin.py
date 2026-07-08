from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from uuid import UUID
from helpers.config import get_db
from helpers.security import get_current_admin
from models.admin_model import Admin
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
    return admin_controller.get_universities_controller(db)


@admin_router.post("/auth/login")
async def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    return admin_controller.login_admin_controller(request, db)


@admin_router.post("/auth/verify-otp")
async def admin_verify_otp(request: AdminOtpVerifyRequest, db: Session = Depends(get_db)):
    return admin_controller.verify_otp_controller(request, db)


@admin_router.put("/profile")
async def update_admin_profile(
    profile_req: AdminProfileUpdateRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return admin_controller.update_profile_controller(profile_req, admin, db)


@admin_router.get("/regulations/pending")
async def get_pending_regulations(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return admin_controller.get_pending_regulations_controller(db)


@admin_router.post("/regulations/{regulation_id}/approve")
async def approve_regulation(
    regulation_id: UUID,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return admin_controller.approve_regulation_controller(str(regulation_id), db)


@admin_router.post("/regulations/{regulation_id}/reject")
async def reject_regulation(
    regulation_id: UUID,
    reject_req: AdminRejectRegulationRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return admin_controller.reject_regulation_controller(str(regulation_id), reject_req.reason, db)
