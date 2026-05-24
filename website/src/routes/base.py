from fastapi import APIRouter,FastAPI

base_router = APIRouter()

@base_router.get("/")
def read_root():
    return {"Hello": "World"}
    