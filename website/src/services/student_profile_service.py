from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from models.student_profile_model import StudentProfile
from models.user_model import Student
from schemes.student_profile_schemes import StudentProfileRequest


class StudentProfileService:
    def get_profile(self, student_id: UUID, db: Session) -> Optional[StudentProfile]:
        return db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

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
                expected_graduation_year=profile_req.expectedGraduationYear,
                total_required_credit_hours=profile_req.totalRequiredCreditHours,
                mandatory_credit_hours=profile_req.mandatoryCreditHours,
                elective_credit_hours=profile_req.electiveCreditHours,
                major_credit_hours=profile_req.majorCreditHours,
                curriculum_pdf_name=profile_req.curriculumPdfName,
                curriculum_pdf_path=curriculum_pdf_path
            )
            db.add(profile)
        else:
            profile.student_id_code = profile_req.studentId
            profile.university = profile_req.university
            profile.faculty = profile_req.faculty
            profile.department = profile_req.department
            profile.enrollment_year = profile_req.enrollmentYear
            profile.expected_graduation_year = profile_req.expectedGraduationYear
            profile.total_required_credit_hours = profile_req.totalRequiredCreditHours
            profile.mandatory_credit_hours = profile_req.mandatoryCreditHours
            profile.elective_credit_hours = profile_req.electiveCreditHours
            profile.major_credit_hours = profile_req.majorCreditHours
            if profile_req.curriculumPdfName:
                profile.curriculum_pdf_name = profile_req.curriculumPdfName
            if curriculum_pdf_path:
                profile.curriculum_pdf_path = curriculum_pdf_path

        db.commit()
        db.refresh(profile)
        return profile


student_profile_service = StudentProfileService()
