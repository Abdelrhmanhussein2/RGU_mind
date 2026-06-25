import re
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from uuid import UUID
from helpers.enums import ResponseStatus
from services.data_service import regulation_service
from controllers.base_controller import BaseController

class DataController(BaseController):
    def __init__(self):
        super().__init__()
        
    def validate_file(self, file: UploadFile):
        if file.content_type not in self.settings.FILE_ALLOWED_TYPES:
            return False, ResponseStatus.FILE_VALIDATION_FAILED.value
        if file.size and file.size > self.settings.FILE_MAX_SIZE_MB * 1024 * 1024:
            return False, ResponseStatus.FILE_SIZE_EXCEEDED.value
        return True, ResponseStatus.FILE_VALIDATED_SUCCESS.value
    
    def clean_file_name(self, orig_file_name: str):
        cleaned_name = re.sub(r'[^\w\-_\. ]', '_', orig_file_name)
        return cleaned_name 

    async def upload_controller(self, department_id: UUID, title: str, version: str, file: UploadFile, db: Session):
        is_valid, msg = self.validate_file(file)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=msg
            )
        
        file.filename = self.clean_file_name(file.filename)

        regulation, document = await regulation_service.upload_service(department_id, title, version, file, db)

        return JSONResponse(
            content={
                "message": ResponseStatus.FILE_VALIDATED_SUCCESS.value,
                "file_id": file.filename,
                "regulation_id": str(regulation.id),
                "document_id": str(document.id)
            },
            status_code=200
        )

    async def reset_content(self, department_id: UUID, db: Session):
        try:
            result = await regulation_service.reset_department_content(department_id, db)
            return JSONResponse(
                content={"status": "success", "message": result["message"]},
                status_code=200
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to reset content: {str(e)}"
            )

data_controller = DataController()
