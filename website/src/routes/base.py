from fastapi import APIRouter
from .auth import auth_router
from .data import data_router
from .admin import admin_router
from .student_profile import student_profile_router
from .term_grades import term_grades_router
from .result_images import result_images_router
from .graduation_check import graduation_check_router
from .notifications import notifications_router
from .retrieve import rerival_router
from .academic_plans import academic_plans_router
from .university import university_router
from .study_planner import study_planner_router

base_router = APIRouter()
base_router.include_router(auth_router, prefix="/auth")
base_router.include_router(data_router, prefix="/data")
base_router.include_router(admin_router, prefix="/admin")
base_router.include_router(university_router, prefix="/university")
base_router.include_router(student_profile_router, prefix="/student")
base_router.include_router(term_grades_router, prefix="/student")
base_router.include_router(result_images_router, prefix="/student")
base_router.include_router(graduation_check_router, prefix="/student")
base_router.include_router(notifications_router, prefix="/notifications")
base_router.include_router(rerival_router, prefix="/retrieval")
base_router.include_router(academic_plans_router, prefix="/academic-plans")
base_router.include_router(study_planner_router, prefix="/student")