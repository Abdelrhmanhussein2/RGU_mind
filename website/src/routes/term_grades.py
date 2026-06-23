from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from models.term_grades_model import TermGrades
from models.course_model import Course
from schemes.term_grades_schemes import TermGradesCreate, TermGradesResponse, CourseResponse

term_grades_router = APIRouter()


@term_grades_router.get("/term-grades", response_model=List[TermGradesResponse])
async def get_term_grades(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    terms = db.query(TermGrades).filter(TermGrades.student_id == student.id).order_by(TermGrades.created_at.desc()).all()
    # Map to schema format
    response = []
    for term in terms:
        courses = [
            CourseResponse(
                id=str(c.id),
                courseName=c.course_name,
                creditHours=c.credit_hours,
                grade=c.grade
            )
            for c in term.courses
        ]
        response.append(
            TermGradesResponse(
                id=str(term.id),
                termName=term.term_name,
                createdDate=term.created_at,
                courses=courses
            )
        )
    return response


@term_grades_router.post("/term-grades", response_model=TermGradesResponse, status_code=status.HTTP_201_CREATED)
async def add_term_grades(
    term_req: TermGradesCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Check if a term with the same name already exists for this student
    existing_term = db.query(TermGrades).filter(
        TermGrades.student_id == student.id,
        TermGrades.term_name == term_req.termName
    ).first()

    if existing_term:
        # Instead of failing, we can add courses to it or delete existing and recreate. Let's delete and recreate to match frontend override.
        db.delete(existing_term)
        db.commit()

    term = TermGrades(
        student_id=student.id,
        term_name=term_req.termName
    )
    db.add(term)
    db.commit()
    db.refresh(term)

    # Add courses
    for c_req in term_req.courses:
        course = Course(
            term_id=term.id,
            course_name=c_req.courseName,
            credit_hours=c_req.creditHours,
            grade=c_req.grade
        )
        db.add(course)

    db.commit()
    db.refresh(term)

    courses = [
        CourseResponse(
            id=str(c.id),
            courseName=c.course_name,
            credit_hours=c.credit_hours,
            grade=c.grade
        )
        for c in term.courses
    ]

    return TermGradesResponse(
        id=str(term.id),
        termName=term.term_name,
        createdDate=term.created_at,
        courses=courses
    )


@term_grades_router.delete("/term-grades/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(
    term_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    term = db.query(TermGrades).filter(
        TermGrades.id == term_id,
        TermGrades.student_id == student.id
    ).first()

    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")

    db.delete(term)
    db.commit()
    return None


@term_grades_router.delete("/term-grades/{term_id}/course/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course_from_term(
    term_id: UUID,
    course_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Verify term belongs to student
    term = db.query(TermGrades).filter(
        TermGrades.id == term_id,
        TermGrades.student_id == student.id
    ).first()

    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")

    course = db.query(Course).filter(
        Course.id == course_id,
        Course.term_id == term_id
    ).first()

    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    db.delete(course)
    db.commit()
    return None
