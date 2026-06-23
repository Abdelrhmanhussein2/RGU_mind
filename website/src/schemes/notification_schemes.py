from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    timestamp: datetime
    read: bool

    class Config:
        from_attributes = True
