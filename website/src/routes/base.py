from fastapi import APIRouter
from routes.auth import auth_router

base_router = APIRouter()
base_router.include_router(auth_router, prefix="/auth")