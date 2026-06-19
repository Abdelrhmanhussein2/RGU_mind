from fastapi import APIRouter, Depends
from schemes.auth_schemes import LoginRequest, studentSignupRequest, universitySignupRequest
from controllers.auth_controller import auth_controller
from sqlalchemy.orm import Session
from helpers.config import get_db

auth_router = APIRouter()

@auth_router.post("/register")
async def register(request: studentSignupRequest, db: Session = Depends(get_db)):
    return auth_controller.register_student_controller(request, db)
    

@auth_router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login_controller(request, db)


from fastapi import Form, UploadFile, File
import shutil
import os

@auth_router.post("/university/register")
async def register_university(
    name: str = Form(...),
    slug: str = Form(...),
    country: str = Form(...),
    contact_email: str = Form(...),
    password: str = Form(...),
    verification_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    request = universitySignupRequest(
        name=name,
        slug=slug,
        country=country,
        contact_email=contact_email,
        password=password
    )
    return auth_controller.register_university_controller(request, verification_file, db)


@auth_router.post("/university/login")
async def login_university(request: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login_university_controller(request, db)
