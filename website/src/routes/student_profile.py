import os
import uuid
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from helpers.config import get_db
from sqlalchemy import func
from helpers.security import get_current_student
from models.user_model import Student
from models.academic_plan_model import AcademicPlan
from models.university_model import University
from schemes.student_profile_schemes import StudentProfileRequest, StudentProfileResponse
from services.student_profile_service import student_profile_service

student_profile_router = APIRouter()


def save_base64_file(base64_str: str, filename: str) -> str:
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    file_data = base64.b64decode(base64_str)
    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_data)
    return file_path


@student_profile_router.post("/profile", response_model=StudentProfileResponse)
async def create_profile(
    profile_req: StudentProfileRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        profile = student_profile_service.create_or_update_profile(
            student_id=student.id,
            profile_req=profile_req,
            curriculum_pdf_path=None,
            db=db
        )
        plan = db.query(AcademicPlan).join(University, AcademicPlan.university_id == University.id).filter(
            func.lower(AcademicPlan.department_name) == func.lower(profile.department),
            func.lower(University.name) == func.lower(profile.university)
        ).first()
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


@student_profile_router.get("/profile", response_model=StudentProfileResponse)
async def get_profile(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
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

    plan = db.query(AcademicPlan).join(University, AcademicPlan.university_id == University.id).filter(
        func.lower(AcademicPlan.department_name) == func.lower(profile.department),
        func.lower(University.name) == func.lower(profile.university)
    ).first()

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


@student_profile_router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(
    profile_req: StudentProfileRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return await create_profile(profile_req, student, db)
