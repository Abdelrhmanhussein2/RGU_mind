import os
import uuid
import base64
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from schemes.student_profile_schemes import StudentProfileRequest, StudentProfileResponse
from controllers.student_profile_controller import student_profile_controller

student_profile_router = APIRouter()

def save_base64_file(base64_str: str, filename: str) -> str:
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    file_data = base64.b64decode(base64_str)
    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_data)
    return file_path


@student_profile_router.post("/profile", response_model=StudentProfileResponse)
async def create_profile(
    profile_req: StudentProfileRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return student_profile_controller.create_or_update_profile_controller(profile_req, student, db)


@student_profile_router.get("/profile", response_model=StudentProfileResponse)
async def get_profile(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return student_profile_controller.get_profile_controller(student, db)


@student_profile_router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(
    profile_req: StudentProfileRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return student_profile_controller.create_or_update_profile_controller(profile_req, student, db)

