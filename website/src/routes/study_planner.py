from fastapi import APIRouter
from schemes.study_planner_schemes import (
    DailyStudyPlannerRequest,
    DailyStudyPlannerResponse,
)
from services.study_planner_service import study_planner_service


study_planner_router = APIRouter()


@study_planner_router.post("/study-planner/daily", response_model=DailyStudyPlannerResponse)
async def generate_daily_study_plan(request: DailyStudyPlannerRequest):
    return study_planner_service.generate_daily_plan(request)