from helpers.config import SessionLocal
from models.user_model import Student
from models.faculty_model import Faculty
from models.university_model import University
from models.department_model import Department
from models.student_profile_model import StudentProfile
import uuid

def fix_data():
    db = SessionLocal()
    try:
        # 1. Get the student
        student = db.query(Student).filter(Student.email == 'student@example.com').first()
        if not student:
            print("Student not found!")
            return
            
        # 2. Make sure they have a university and faculty
        uni = db.query(University).first()
        if not uni:
            uni = University(name="Test Uni", slug="test-uni", country="Egypt", contact_email="uni@example.com", password="pwd", status="approved", is_email_verified=True)
            db.add(uni)
            db.commit()
            db.refresh(uni)
            
        fac = db.query(Faculty).filter(Faculty.university_id == uni.id).first()
        if not fac:
            fac = Faculty(name="Test Faculty", university_id=uni.id, slug="test-fac")
            db.add(fac)
            db.commit()
            db.refresh(fac)
            
        student.university_id = uni.id
        student.faculty_id = fac.id
        db.commit()
        
        # 3. Ensure a Department exists for this Faculty
        dept = db.query(Department).filter(Department.faculty_id == fac.id).first()
        if not dept:
            dept = Department(name="Computer Science", faculty_id=fac.id, code="CS101")
            db.add(dept)
            db.commit()
            db.refresh(dept)
            
        # 4. Create the student profile
        profile = db.query(StudentProfile).filter(StudentProfile.student_id == student.id).first()
        if not profile:
            profile = StudentProfile(
                student_id=student.id,
                student_id_code="123456",
                university=uni.name,
                faculty=fac.name,
                department=dept.name,
                enrollment_year=2023,
                expected_graduation_year=2027,
                total_required_credit_hours=140,
                mandatory_credit_hours=100,
                elective_credit_hours=20,
                major_credit_hours=20
            )
            db.add(profile)
            db.commit()
            
        print("Done! Data is fixed.")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()
