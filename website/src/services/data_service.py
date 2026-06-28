from sqlalchemy.orm import Session
from fastapi import UploadFile
from uuid import UUID
from models import Document, Regulation, Department, Faculty, Chunk
from services.embedding_service import embedding_service
import os


class RegulationService:
    async def upload_service(self, department_id: UUID, title: str, version: str, file: UploadFile, db: Session):
        from helpers.enums import RegulationStatus

        # Find existing active/draft regulations for this department
        old_regulations = db.query(Regulation).filter(
            Regulation.department_id == department_id,
            Regulation.status != RegulationStatus.archived
        ).all()
        
        # Create the new regulation
        new_regulation = Regulation(
            department_id=department_id,
            title=title,
            version=version,
            status=RegulationStatus.draft
        )
        db.add(new_regulation)
        db.commit()
        db.refresh(new_regulation)
        
        # Archive old ones and delete their vectors
        if old_regulations:
            for old_reg in old_regulations:
                old_reg.status = RegulationStatus.archived
                old_reg.superseded_by = new_regulation.id
                
                # Delete vectors of old regulation's documents
                docs = db.query(Document).filter(Document.regulation_id == old_reg.id).all()
                if docs:
                    doc_ids = [d.id for d in docs]
                    embedding_service.delete_embedding_documents(doc_ids)
            db.commit()

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

    async def reset_department_content(self, department_id: UUID, db: Session):
        # 1. Get all regulations for this department
        regulations = db.query(Regulation).filter(Regulation.department_id == department_id).all()
        if not regulations:
            return {"message": "No content found for this department (no regulations)."}
            
        regulation_ids = [r.id for r in regulations]
        
        # 2. Get all documents for these regulations
        documents = db.query(Document).filter(Document.regulation_id.in_(regulation_ids)).all()
        document_ids = [d.id for d in documents]
        
        # 3. Delete vectors from Qdrant
        if document_ids:
            embedding_service.delete_embedding_documents(document_ids)
            
        return {"message": "Department Qdrant embeddings have been completely reset."}


regulation_service = RegulationService()

