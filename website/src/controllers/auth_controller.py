from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.auth_service import (
    login_student,
    login_university,
    register_student,
    register_university,
)

def register_student_controller(request, db: Session):
    try:
        student = register_student(request, db)
        return {
            "message": "student registered successfully",
            "user": {
                "id": str(student.id),
                "name": student.name,
                "email": student.email,
                "university_id": str(student.university_id) if student.university_id else None,
                "faculty_id": str(student.faculty_id) if student.faculty_id else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

def login_controller(request, db: Session):
    try:
        student = login_student(request, db)
        return {
            "message": "login successful",
            "user": {
                "id": str(student.id),
                "name": student.name,
                "email": student.email
            }
        }
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


def register_university_controller(request, db: Session):
    try:
        university = register_university(request, db)
        return {
            "message": "university registered successfully",
            "user": {
                "id": str(university.id),
                "name": university.name,
                "slug": university.slug,
                "country": university.country,
                "contact_email": university.contact_email
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


def login_university_controller(request, db: Session):
    try:
        university = login_university(request, db)
        return {
            "message": "university login successful",
            "user": {
                "id": str(university.id),
                "name": university.name,
                "slug": university.slug,
                "country": university.country,
                "contact_email": university.contact_email
            }
        }
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
