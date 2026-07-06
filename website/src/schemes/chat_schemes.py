from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class SourceSchema(BaseModel):
    title: str
    section: str

class ChatMessageSchema(BaseModel):
    id: UUID
    role: str
    content: str
    sources: Optional[List[SourceSchema]] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ChatSessionSchema(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ChatSessionListResponse(BaseModel):
    message: str
    data: List[ChatSessionSchema]

class ChatMessageListResponse(BaseModel):
    message: str
    data: List[ChatMessageSchema]
