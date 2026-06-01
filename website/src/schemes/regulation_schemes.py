from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from helpers.enums import UserType
from uuid import UUID



class upload_request(BaseModel):
    department_id: UUID
    title: str 
    version:str


class upload_response(BaseModel):
    regulation_id:UUID
    file_name:str
    message:str

    

