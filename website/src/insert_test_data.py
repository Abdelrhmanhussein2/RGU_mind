from sqlalchemy.orm import Session
from helpers.config import SessionLocal
from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department

def insert_test_data():
    db: Session = SessionLocal()
    
    # 1. Insert University
    university_name = "Tanta"
    existing_uni = db.query(University).filter(
        (University.name == university_name) |
        (University.slug == "tanta-uni") |
        (University.contact_email == "contact@tanta.edu.eg")
    ).first()
    
    if not existing_uni:
        existing_uni = University(
            name=university_name,
            slug="tanta-uni",
            country="Egypt",
            contact_email="contact@tanta.edu.eg",
            password="hashed_dummy_password"
        )
        db.add(existing_uni)
        db.commit()
        db.refresh(existing_uni)
        print(f"University '{university_name}' created.")
    else:
        print(f"University '{university_name}' already exists.")

    # 2. Insert Faculty
    faculty_name = "Engineering"
    existing_faculty = db.query(Faculty).filter(
        Faculty.name == faculty_name,
        Faculty.university_id == existing_uni.id
    ).first()

    if not existing_faculty:
        existing_faculty = Faculty(
            name=faculty_name,
            code="ENG",
            university_id=existing_uni.id
        )
        db.add(existing_faculty)
        db.commit()
        db.refresh(existing_faculty)
        print(f"Faculty '{faculty_name}' created.")
    else:
        print(f"Faculty '{faculty_name}' already exists.")

    # 3. Insert Department
    department_name = "Computer Engineering"
    existing_department = db.query(Department).filter(
        Department.name == department_name,
        Department.faculty_id == existing_faculty.id
    ).first()

    if not existing_department:
        existing_department = Department(
            name=department_name,
            code="CSE",
            faculty_id=existing_faculty.id
        )
        db.add(existing_department)
        db.commit()
        db.refresh(existing_department)
        print(f"Department '{department_name}' created.")
    else:
        print(f"Department '{department_name}' already exists.")

    print(f"Use this department_id for upload tests: {existing_department.id}")

    db.close()

if __name__ == "__main__":
    insert_test_data()
