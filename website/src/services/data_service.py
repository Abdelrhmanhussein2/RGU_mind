from sqlalchemy.orm import Session
from fastapi import UploadFile
from uuid import UUID
from models import Document, Regulation
from helpers.config import get_db
from fastapi.responses import JSONResponse
from  helpers.enums import ResponseStatus 


class regulationservice():
    async def upload_service(self,department_id:UUID, title:str, version:str, file:UploadFile, db:Session):
        
        new_regulation=Regulation(
            department_id=department_id,
            title=title,
            version=version
        )
        db.add(new_regulation)
        db.commit()
        db.refresh(new_regulation)

        new_document=Document(
            regulation_id=new_regulation.id,
            filename=file.filename,
            storage_path=f"uploads/{file.filename}",
            file_size_bytes=file.size
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        return JSONResponse(
            content={
                "message": ResponseStatus.FILE_VALIDATED_SUCCESS.value,
                "file_id": file.filename,
                "regulation_id": str(new_regulation.id)
        
            },
            status_code=200
        )
