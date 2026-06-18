from sqlalchemy.orm import Session
from fastapi import UploadFile
from uuid import UUID
from models import Document, Regulation
import os


class RegulationService:
    async def upload_service(self, department_id: UUID, title: str, version: str, file: UploadFile, db: Session):
        
        new_regulation = Regulation(
            department_id=department_id,
            title=title,
            version=version
        )
        db.add(new_regulation)
        db.commit()
        db.refresh(new_regulation)

        storage_path = f"uploads/{file.filename}"
        new_document = Document(
            regulation_id=new_regulation.id,
            filename=file.filename,
            storage_path=storage_path,
            file_size_bytes=file.size
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        os.makedirs("uploads", exist_ok=True)
        with open(storage_path, "wb") as buffer:
            file.file.seek(0)
            buffer.write(file.file.read())

        return new_regulation, new_document


regulation_service = RegulationService()
