
from sqlalchemy.orm import Session
from models.user_model import Student
from helpers.security import verify_password , hash_password
from models.university_model import University
from models.faculty_model import Faculty

def register_student(request, db: Session):
    existing_student = db.query(Student).filter(Student.email == request.email).first()

    if existing_student:
        raise ValueError("Email already exists")
    
    university_id = None
    faculty_id = None

    if request.university_name:
        university = db.query(University).filter(University.name == request.university_name).first()
        if university:
            university_id = university.id
            
            if request.faculty:
                faculty = db.query(Faculty).filter(
                    Faculty.name == request.faculty,
                    Faculty.university_id == university.id
                ).first()
                if faculty:
                    faculty_id = faculty.id

    student = Student(
        name=request.username,
        email=request.email,
        password=hash_password(request.password),
        university_id=university_id,
        faculty_id=faculty_id
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


def login_student(request, db: Session):
    student = db.query(Student).filter(
        (Student.email == request.email_or_username) |
        (Student.name == request.email_or_username)
    ).first()

    if not student or not verify_password(request.password, student.password):
        raise PermissionError("Invalid email/username or password")
        
    return student


def register_university(request, db: Session):
    existing_university = db.query(University).filter(
        (University.contact_email == request.contact_email) |
        (University.slug == request.slug)
    ).first()

    if existing_university:
        raise ValueError("University email or slug already exists")

    university = University(
        name=request.name,
        slug=request.slug,
        country=request.country,
        contact_email=request.contact_email,
        password=hash_password(request.password)
    )

    db.add(university)
    db.commit()
    db.refresh(university)

    return university


def login_university(request, db: Session):
    university = db.query(University).filter(
        (University.contact_email == request.email_or_username) |
        (University.name == request.email_or_username) |
        (University.slug == request.email_or_username)
    ).first()

    if not university or not verify_password(request.password, university.password):
        raise PermissionError("Invalid email/name/slug or password")

    return university
