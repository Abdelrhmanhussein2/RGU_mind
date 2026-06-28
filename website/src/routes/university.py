from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, Form, File
from sqlalchemy.orm import Session
from helpers.config import get_db, SessionLocal
from helpers.security import get_current_university
from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department
from models.regulation_model import Regulation
from models.document_model import Document
from controllers.data_controller import data_controller
from controllers.chunk_controller import ChunkController
from uuid import UUID
import json
from datetime import datetime

university_router = APIRouter()
chunk_controller = ChunkController()

async def process_chunk_background(document_id: UUID):
    db = SessionLocal()
    try:
        await chunk_controller.extract_chunk(document_id, db)
    finally:
        db.close()

@university_router.post("/upload-regulation")
async def upload_regulation(
    background_tasks: BackgroundTasks,
    faculty_name: str = Form(...),
    department_name: str = Form(...),
    title: str = Form(...),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    # 1. Find or create Faculty
    faculty = db.query(Faculty).filter(
        Faculty.university_id == university.id,
        Faculty.name.ilike(faculty_name)
    ).first()
    
    if not faculty:
        faculty = Faculty(university_id=university.id, name=faculty_name)
        db.add(faculty)
        db.commit()
        db.refresh(faculty)
        
    # 2. Find or create Department
    department = db.query(Department).filter(
        Department.faculty_id == faculty.id,
        Department.name.ilike(department_name)
    ).first()
    
    if not department:
        department = Department(faculty_id=faculty.id, name=department_name)
        db.add(department)
        db.commit()
        db.refresh(department)
        
    # 3. Call upload_controller
    result = await data_controller.upload_controller(department.id, title, version, file, db)
    
    # 4. Trigger chunking
    response_data = json.loads(result.body.decode('utf-8'))
    document_id_str = response_data.get("document_id")
    
    if document_id_str:
        background_tasks.add_task(process_chunk_background, UUID(document_id_str))
        
    return result

@university_router.get("/regulations")
async def get_regulations(
    university: University = Depends(get_current_university),
    db: Session = Depends(get_db)
):
    query = db.query(
        Regulation.id,
        Regulation.title,
        Document.filename.label("document_name"),
        Document.uploaded_at.label("upload_date"),
        Regulation.status,
        Regulation.rejection_reason
    ).join(
        Department, Regulation.department_id == Department.id
    ).join(
        Faculty, Department.faculty_id == Faculty.id
    ).outerjoin(
        Document, Document.regulation_id == Regulation.id
    ).filter(
        Faculty.university_id == university.id
    ).order_by(
        Regulation.created_at.desc()
    )

    results = query.all()
    submissions = []
    for r in results:
        if r.status.value == "active":
            status_str = "completed"
        elif r.status.value == "archived":
            status_str = "rejected"
        else:
            status_str = "processing"

        # Format time manually if isoformat is not ideal, but isoformat is standard for TS
        # Alternatively, we can use a friendly format, or let frontend parse it
        dt = r.upload_date or datetime.utcnow()
        friendly_time = dt.strftime("%B %d, %Y - %H:%M")

        submissions.append({
            "id": str(r.id),
            "name": r.title or r.document_name,
            "status": status_str,
            "uploadedAt": friendly_time
        })
        
    return submissions
