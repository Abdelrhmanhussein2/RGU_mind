from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, Form, File, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from helpers.config import get_db
from helpers.security import get_current_university
from models.university_model import University
from controllers.university_controller import university_controller

university_router = APIRouter()


@university_router.post("/upload-regulation")
async def upload_regulation(
    background_tasks: BackgroundTasks,
    faculty_name: str = Form(...),
    department_name: str = Form(...),
    title: str = Form(...),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    return await university_controller.upload_regulation_controller(
        background_tasks, faculty_name, department_name, title, version, file, university, db
    )

@university_router.get("/regulations")
async def get_regulations(
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    return university_controller.get_regulations_controller(university, db)

@university_router.delete("/reset-regulation")
async def reset_regulation(
    faculty_name: str,
    department_name: str,
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    return await university_controller.reset_regulation_controller(faculty_name, department_name, university, db)

class UpdateProfileRequest(BaseModel):
    name: str
    contact_email: str
    password: str

@university_router.put("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    return university_controller.update_profile_controller(req.name, req.contact_email, req.password, university, db)
