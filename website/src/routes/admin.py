from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from helpers.config import get_db
from schemes.admin_schemes import AdminCreateRequest
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
    x_admin_id: str = Header(..., description="The ID of the admin"), 
    db: Session = Depends(get_db)
):
    return admin_controller.change_university_status_controller(university_id, "approved", x_admin_id, db)

@admin_router.post("/reject-university/{university_id}")
async def reject_university(
    university_id: str, 
    x_admin_id: str = Header(..., description="The ID of the admin"), 
    db: Session = Depends(get_db)
):
    return admin_controller.change_university_status_controller(university_id, "rejected", x_admin_id, db)
