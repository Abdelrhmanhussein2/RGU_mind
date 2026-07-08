from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from models.student_profile_model import StudentProfile
from models.user_model import Student
from schemes.student_profile_schemes import StudentProfileRequest


from models.academic_plan_model import AcademicPlan
from models.university_model import University
from sqlalchemy import func

class StudentProfileService:
    def get_profile(self, student_id: UUID, db: Session) -> Optional[StudentProfile]:
        return db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

    def get_academic_plan(self, department: str, university_name: str, db: Session) -> Optional[AcademicPlan]:
        return db.query(AcademicPlan).join(University, AcademicPlan.university_id == University.id).filter(
            func.lower(AcademicPlan.department_name) == func.lower(department),
            func.lower(University.name) == func.lower(university_name)
        ).first()

    def create_or_update_profile(
        self,
        student_id: UUID,
        profile_req: StudentProfileRequest,
        curriculum_pdf_path: Optional[str],
        db: Session
    ) -> StudentProfile:
        # Get student
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        # Check if profile already exists
        profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

        if not profile:
            profile = StudentProfile(
                student_id=student_id,
                student_id_code=profile_req.studentId,
                university=profile_req.university,
                faculty=profile_req.faculty,
                department=profile_req.department,
                enrollment_year=profile_req.enrollmentYear,
                expected_graduation_year=profile_req.expectedGraduationYear
            )
            db.add(profile)
        else:
            profile.student_id_code = profile_req.studentId
            profile.university = profile_req.university
            profile.faculty = profile_req.faculty
            profile.department = profile_req.department
            profile.enrollment_year = profile_req.enrollmentYear
            profile.expected_graduation_year = profile_req.expectedGraduationYear

        db.commit()
        db.refresh(profile)
        return profile


student_profile_service = StudentProfileService()
