from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from helpers.config import get_db
from helpers.security import get_current_university
from models.university_model import University
from schemes.academic_plan_schemes import AcademicPlanCreate, AcademicPlanResponse
from controllers.academic_plan_controller import academic_plan_controller

academic_plans_router = APIRouter()

@academic_plans_router.get("/", response_model=List[AcademicPlanResponse])
def get_all_plans(university: University = Depends(get_current_university), db: Session = Depends(get_db)):
    return academic_plan_controller.get_all(university.id, db)

@academic_plans_router.post("/", response_model=AcademicPlanResponse)
def create_plan(req: AcademicPlanCreate, university: University = Depends(get_current_university), db: Session = Depends(get_db)):
    return academic_plan_controller.create_plan(university.id, req, db)

@academic_plans_router.put("/{plan_id}", response_model=AcademicPlanResponse)
def update_plan(plan_id: UUID, req: AcademicPlanCreate, university: University = Depends(get_current_university), db: Session = Depends(get_db)):
    return academic_plan_controller.update_plan(plan_id, university.id, req, db)

@academic_plans_router.delete("/{plan_id}")
def delete_plan(plan_id: UUID, university: University = Depends(get_current_university), db: Session = Depends(get_db)):
    return academic_plan_controller.delete_plan(plan_id, university.id, db)
