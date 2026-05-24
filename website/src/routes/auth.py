from fastapi import FastAPI, APIRouter
from schemes.auth_schemes import studentSignupRequest
auth_router = APIRouter()

@auth_router.post("/register")
async def register(request: studentSignupRequest):
    return { "message": "success" }
    

