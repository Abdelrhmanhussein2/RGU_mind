from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from schemes.term_grades_schemes import TermGradesCreate, TermGradesResponse
from controllers.term_grades_controller import term_grades_controller

term_grades_router = APIRouter()


@term_grades_router.get("/term-grades", response_model=List[TermGradesResponse])
async def get_term_grades(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return term_grades_controller.get_term_grades_controller(student, db)


@term_grades_router.post("/term-grades", response_model=TermGradesResponse, status_code=status.HTTP_201_CREATED)
async def add_term_grades(
    term_req: TermGradesCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return term_grades_controller.add_term_grades_controller(term_req, student, db)


@term_grades_router.delete("/term-grades/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(
    term_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return term_grades_controller.delete_term_controller(term_id, student, db)


@term_grades_router.delete("/term-grades/{term_id}/course/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course_from_term(
    term_id: UUID,
    course_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return term_grades_controller.delete_course_from_term_controller(term_id, course_id, student, db)

