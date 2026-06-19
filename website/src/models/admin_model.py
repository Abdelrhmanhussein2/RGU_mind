from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base

class Admin(Base):
    __tablename__ = "admins"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password      = Column(String, nullable=False)
    is_super_admin= Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
