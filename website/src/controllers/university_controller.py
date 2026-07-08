from fastapi import HTTPException, BackgroundTasks, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
import json
from services.university_service import university_service
from controllers.data_controller import data_controller
from controllers.chunk_controller import ChunkController
from helpers.config import SessionLocal
from models.university_model import University


chunk_controller = ChunkController()

async def process_chunk_background(document_id: UUID):
    db = SessionLocal()
    try:
        await chunk_controller.extract_chunk(document_id, db)
    finally:
        db.close()


class UniversityController:
    async def upload_regulation_controller(
        self, 
        background_tasks: BackgroundTasks, 
        faculty_name: str, 
        department_name: str, 
        title: str, 
        version: str, 
        file: UploadFile, 
        university: University, 
        db: Session
    ):
        department = university_service.get_or_create_faculty_and_department(
            university.id, faculty_name, department_name, db
        )
        
        result = await data_controller.upload_controller(department.id, title, version, file, db)
        
        response_data = json.loads(result.body.decode('utf-8'))
        document_id_str = response_data.get("document_id")
        
        if document_id_str:
            background_tasks.add_task(process_chunk_background, UUID(document_id_str))
            
        return result

    def get_regulations_controller(self, university: University, db: Session):
        return university_service.get_regulations(university.id, db)

    async def reset_regulation_controller(self, faculty_name: str, department_name: str, university: University, db: Session):
        try:
            department = university_service.get_department_by_names(university.id, faculty_name, department_name, db)
            return await data_controller.reset_content(department.id, db)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    def update_profile_controller(self, name: str, contact_email: str, password: str, university: University, db: Session):
        try:
            updated_uni = university_service.update_profile(university, name, contact_email, password, db)
            return {
                "message": "Profile updated successfully",
                "user": {
                    "id": str(updated_uni.id),
                    "name": updated_uni.name,
                    "email": updated_uni.contact_email,
                    "role": "university"
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))


university_controller = UniversityController()
