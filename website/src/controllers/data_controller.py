import re
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from uuid import UUID
from helpers.enums import ResponseStatus, FileTypeEnum
from services import regulationservice
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

        return await regulationservice().upload_service(department_id, title, version, file, db)

data_controller = DataController()