from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from controllers.graduation_check_controller import graduation_check_controller

graduation_check_router = APIRouter()

@graduation_check_router.get("/graduation-check")
async def check_graduation_eligibility(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return graduation_check_controller.check_graduation_eligibility_controller(student, db)

