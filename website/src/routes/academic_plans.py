from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from helpers.config import get_db
from schemes.academic_plan_schemes import AcademicPlanCreate, AcademicPlanResponse
from controllers.academic_plan_controller import academic_plan_controller
# You could add security here, but since students need to GET and admin needs to POST,
# it's best handled per route or simply open GET and protected POST if needed.

academic_plans_router = APIRouter()

@academic_plans_router.get("/", response_model=List[AcademicPlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    return academic_plan_controller.get_all(db)

@academic_plans_router.get("/by-program/{program_name}", response_model=AcademicPlanResponse)
def get_plan_by_program(program_name: str, db: Session = Depends(get_db)):
    return academic_plan_controller.get_by_program(program_name, db)

@academic_plans_router.post("/", response_model=AcademicPlanResponse)
def create_plan(req: AcademicPlanCreate, db: Session = Depends(get_db)):
    # Note: Protect this route with get_current_admin in a production setting
    return academic_plan_controller.create_plan(req, db)

@academic_plans_router.put("/{plan_id}", response_model=AcademicPlanResponse)
def update_plan(plan_id: UUID, req: AcademicPlanCreate, db: Session = Depends(get_db)):
    return academic_plan_controller.update_plan(plan_id, req, db)

@academic_plans_router.delete("/{plan_id}")
def delete_plan(plan_id: UUID, db: Session = Depends(get_db)):
    return academic_plan_controller.delete_plan(plan_id, db)
