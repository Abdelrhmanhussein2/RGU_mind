from fastapi import APIRouter
from .auth import auth_router
from .data import data_router
from .admin import admin_router

base_router = APIRouter()
base_router.include_router(auth_router, prefix="/auth")
base_router.include_router(data_router, prefix="/data")
base_router.include_router(admin_router, prefix="/admin")
