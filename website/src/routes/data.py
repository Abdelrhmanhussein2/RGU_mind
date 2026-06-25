from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile
from sqlalchemy.orm import Session
from helpers.config import get_db, SessionLocal
from controllers.data_controller import data_controller
from controllers.chunk_controller import ChunkController
from uuid import UUID
import json

chunk_controller = ChunkController()

data_router = APIRouter()

async def process_chunk_background(document_id: UUID):
    db = SessionLocal()
    try:
        await chunk_controller.extract_chunk(document_id, db)
    finally:
        db.close()

@data_router.post("/upload")
async def upload_file(
    department_id: UUID, 
    title: str, 
    version: str, 
    file: UploadFile, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # This returns a JSONResponse
    result = await data_controller.upload_controller(department_id, title, version, file, db)
    
    # Extract document_id from the JSONResponse body
    response_data = json.loads(result.body.decode('utf-8'))
    document_id_str = response_data.get("document_id")
    
    if document_id_str:
        # Add the background task
        background_tasks.add_task(process_chunk_background, UUID(document_id_str))
        
    # We return the original upload result so the user gets a fast response
    return result

@data_router.delete("/reset/{department_id}")
async def reset_department_data(department_id: UUID, db: Session = Depends(get_db)):
    return await data_controller.reset_content(department_id, db)