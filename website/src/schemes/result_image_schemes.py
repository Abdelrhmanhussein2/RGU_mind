from pydantic import BaseModel
from datetime import datetime


class ResultImageCreate(BaseModel):
    termName: str
    imageBase64: str


class ResultImageResponse(BaseModel):
    id: str
    termName: str
    uploadDate: datetime
    imageUrl: str

    class Config:
        from_attributes = True
