from fastapi import FastAPI, APIRouter , Depends
from schemes.auth_schemes import studentSignupRequest , LoginRequest
from services.auth_service import login_service , register_student_service
from sqlalchemy.orm import Session
from helpers.config import get_db

auth_router = APIRouter()

@auth_router.post("/register")
async def register(request: studentSignupRequest, db: Session = Depends(get_db)):
    return register_student_service(request, db)
    

@auth_router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return login_service(request, db)

