"""
    The path : website/src/services/auth_service.py
    ================================================


    1. Take email/username and password from route
    2. Search database for this student
    3. If student does not exist, return error
    4. If password is wrong, return error
    5. If everything is correct, return success


"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.user_model import Student
from helpers.security import verify_password , hash_password
from models.university_model import University
from models.faculty_model import Faculty

def register_student_service(request, db: Session):
    existing_student = db.query(Student).filter(Student.email == request.email).first()

    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    university = db.query(University).filter(University.name == request.university_name).first()

    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )


    faculty = db.query(Faculty).filter(
    Faculty.name == request.faculty,
    Faculty.university_id == university.id
    ).first()

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty not found"
        )

    student = Student(
    name=request.username,
    email=request.email,
    password=hash_password(request.password),
    university_id=university.id,
    faculty_id=faculty.id
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "student registered successfully",
        "user": {
            "id": str(student.id),
            "name": student.name,
            "email": student.email,
            "university_id": str(student.university_id),
            "faculty_id": str(student.faculty_id)
        }
    }



def login_service(request, db: Session):
    student = db.query(Student).filter(
        (Student.email == request.email_or_username) |
        (Student.name == request.email_or_username)
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password"
        )
    if not verify_password(request.password, student.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password"
        )
    return {
        "message": "login successful",
        "user": {
            "id": str(student.id),
            "name": student.name,
            "email": student.email
        }
    }