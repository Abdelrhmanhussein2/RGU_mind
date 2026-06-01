from fastapi import APIRouter, Depends
from schemes.auth_schemes import LoginRequest, studentSignupRequest, universitySignupRequest
from controllers.auth_controller import (
    login_controller,
    login_university_controller,
    register_student_controller,
    register_university_controller,
)
from sqlalchemy.orm import Session
from helpers.config import get_db

auth_router = APIRouter()

@auth_router.post("/register")
async def register(request: studentSignupRequest, db: Session = Depends(get_db)):
    return register_student_controller(request, db)
    

@auth_router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return login_controller(request, db)


@auth_router.post("/university/register")
async def register_university(request: universitySignupRequest, db: Session = Depends(get_db)):
    return register_university_controller(request, db)


@auth_router.post("/university/login")
async def login_university(request: LoginRequest, db: Session = Depends(get_db)):
    return login_university_controller(request, db)
