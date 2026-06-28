import os
import uuid
import base64
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status
from models.academic_plan_model import AcademicPlan
from schemes.academic_plan_schemes import AcademicPlanCreate, AcademicPlanResponse

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

class AcademicPlanController:
    def _to_response(self, plan: AcademicPlan) -> AcademicPlanResponse:
        if not plan: return None
        return AcademicPlanResponse(
            id=plan.id,
            programName=plan.program_name,
            totalRequiredCreditHours=plan.total_required_credit_hours,
            mandatoryCreditHours=plan.mandatory_credit_hours,
            electiveCreditHours=plan.elective_credit_hours,
            majorCreditHours=plan.major_credit_hours,
            curriculumPdfName=plan.curriculum_pdf_name,
            curriculumPdfPath=plan.curriculum_pdf_path
        )

    def get_all(self, db: Session):
        plans = db.query(AcademicPlan).all()
        return [self._to_response(p) for p in plans]

    def get_by_program(self, program_name: str, db: Session):
        from sqlalchemy import func
        plan = db.query(AcademicPlan).filter(func.lower(AcademicPlan.program_name) == func.lower(program_name)).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Academic plan not found")
        return self._to_response(plan)

    def create_plan(self, req: AcademicPlanCreate, db: Session):
        from sqlalchemy import func
        existing = db.query(AcademicPlan).filter(func.lower(AcademicPlan.program_name) == func.lower(req.programName)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Academic plan for this program already exists")

        pdf_path = None
        if req.curriculumPdfName and req.curriculumPdfBase64:
            pdf_path = save_base64_file(req.curriculumPdfBase64, req.curriculumPdfName)

        plan = AcademicPlan(
            program_name=req.programName,
            total_required_credit_hours=req.totalRequiredCreditHours,
            mandatory_credit_hours=req.mandatoryCreditHours,
            elective_credit_hours=req.electiveCreditHours,
            major_credit_hours=req.majorCreditHours,
            curriculum_pdf_name=req.curriculumPdfName,
            curriculum_pdf_path=pdf_path
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return self._to_response(plan)

    def update_plan(self, plan_id: UUID, req: AcademicPlanCreate, db: Session):
        from sqlalchemy import func
        plan = db.query(AcademicPlan).filter(AcademicPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Academic plan not found")

        # Check name conflict
        existing = db.query(AcademicPlan).filter(func.lower(AcademicPlan.program_name) == func.lower(req.programName), AcademicPlan.id != plan_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another plan with this program name already exists")

        plan.program_name = req.programName
        plan.total_required_credit_hours = req.totalRequiredCreditHours
        plan.mandatory_credit_hours = req.mandatoryCreditHours
        plan.elective_credit_hours = req.electiveCreditHours
        plan.major_credit_hours = req.majorCreditHours

        if req.curriculumPdfName and req.curriculumPdfBase64:
            pdf_path = save_base64_file(req.curriculumPdfBase64, req.curriculumPdfName)
            plan.curriculum_pdf_name = req.curriculumPdfName
            plan.curriculum_pdf_path = pdf_path

        db.commit()
        db.refresh(plan)
        return self._to_response(plan)

    def delete_plan(self, plan_id: UUID, db: Session):
        plan = db.query(AcademicPlan).filter(AcademicPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Academic plan not found")
        db.delete(plan)
        db.commit()
        return {"message": "Plan deleted successfully"}

academic_plan_controller = AcademicPlanController()
