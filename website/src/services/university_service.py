from sqlalchemy.orm import Session
from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department
from models.regulation_model import Regulation
from models.document_model import Document
from datetime import datetime
from helpers.security import verify_password


class UniversityService:
    def get_or_create_faculty_and_department(self, university_id: str, faculty_name: str, department_name: str, db: Session):
        faculty = db.query(Faculty).filter(
            Faculty.university_id == university_id,
            Faculty.name.ilike(faculty_name)
        ).first()
        
        if not faculty:
            faculty = Faculty(university_id=university_id, name=faculty_name)
            db.add(faculty)
            db.commit()
            db.refresh(faculty)
            
        department = db.query(Department).filter(
            Department.faculty_id == faculty.id,
            Department.name.ilike(department_name)
        ).first()
        
        if not department:
            department = Department(faculty_id=faculty.id, name=department_name)
            db.add(department)
            db.commit()
            db.refresh(department)
            
        return department

    def get_regulations(self, university_id: str, db: Session):
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
            Faculty.university_id == university_id
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

            dt = r.upload_date or datetime.utcnow()
            friendly_time = dt.strftime("%B %d, %Y - %H:%M")

            submissions.append({
                "id": str(r.id),
                "name": r.title or r.document_name,
                "status": status_str,
                "uploadedAt": friendly_time
            })
            
        return submissions

    def get_department_by_names(self, university_id: str, faculty_name: str, department_name: str, db: Session):
        faculty = db.query(Faculty).filter(
            Faculty.university_id == university_id,
            Faculty.name.ilike(faculty_name)
        ).first()
        
        if not faculty:
            raise ValueError("Faculty not found")
            
        department = db.query(Department).filter(
            Department.faculty_id == faculty.id,
            Department.name.ilike(department_name)
        ).first()
        
        if not department:
            raise ValueError("Department not found")
            
        return department

    def update_profile(self, university: University, name: str, contact_email: str, password: str, db: Session):
        if not verify_password(password, university.password):
            raise PermissionError("Incorrect password")
        
        university.name = name
        university.contact_email = contact_email
        db.commit()
        db.refresh(university)
        return university


university_service = UniversityService()
