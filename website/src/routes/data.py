from fastapi import APIRouter , Depends
from sqlalchemy.orm import Session
from helpers.config import get_db
from controllers.data_controller import data_controller
from fastapi import UploadFile
from uuid import UUID

data_router = APIRouter()

@data_router.post("/upload")
async def upload_file(department_id: UUID, title: str, version: str, file: UploadFile, db: Session = Depends(get_db)):
    return await data_controller.upload_controller(department_id, title, version, file, db)
