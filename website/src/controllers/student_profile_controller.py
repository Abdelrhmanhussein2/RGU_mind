from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.user_model import Student
from schemes.student_profile_schemes import StudentProfileRequest, StudentProfileResponse
from services.student_profile_service import student_profile_service


class StudentProfileController:
    def create_or_update_profile_controller(self, profile_req: StudentProfileRequest, student: Student, db: Session):
        try:
            profile = student_profile_service.create_or_update_profile(
                student_id=student.id,
                profile_req=profile_req,
                curriculum_pdf_path=None,
                db=db
            )
            plan = student_profile_service.get_academic_plan(profile.department, profile.university, db)
            
            return StudentProfileResponse(
                fullName=student.name,
                studentId=profile.student_id_code,
                university=profile.university,
                faculty=profile.faculty,
                department=profile.department,
                enrollmentYear=profile.enrollment_year,
                expectedGraduationYear=profile.expected_graduation_year,
                totalRequiredCreditHours=plan.total_required_credit_hours if plan else 0,
                mandatoryCreditHours=plan.mandatory_credit_hours if plan else 0,
                electiveCreditHours=plan.elective_credit_hours if plan else 0,
                majorCreditHours=plan.major_credit_hours if plan else 0,
                curriculumPdfName=plan.curriculum_pdf_name if plan else None,
                curriculumPdfPath=plan.curriculum_pdf_path if plan else None
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def get_profile_controller(self, student: Student, db: Session):
        profile = student_profile_service.get_profile(student.id, db)
        if not profile:
            # Return a blank profile using student's registered details
            return StudentProfileResponse(
                fullName=student.name,
                studentId="",
                university="",
                faculty="",
                department="",
                enrollmentYear=0,
                expectedGraduationYear=0
            )

        plan = student_profile_service.get_academic_plan(profile.department, profile.university, db)

        return StudentProfileResponse(
            fullName=student.name,
            studentId=profile.student_id_code,
            university=profile.university,
            faculty=profile.faculty,
            department=profile.department,
            enrollmentYear=profile.enrollment_year,
            expectedGraduationYear=profile.expected_graduation_year,
            totalRequiredCreditHours=plan.total_required_credit_hours if plan else 0,
            mandatoryCreditHours=plan.mandatory_credit_hours if plan else 0,
            electiveCreditHours=plan.elective_credit_hours if plan else 0,
            majorCreditHours=plan.major_credit_hours if plan else 0,
            curriculumPdfName=plan.curriculum_pdf_name if plan else None,
            curriculumPdfPath=plan.curriculum_pdf_path if plan else None
        )


student_profile_controller = StudentProfileController()
