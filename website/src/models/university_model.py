from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base


class University(Base):
    __tablename__ = "university"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name          = Column(String(255), nullable=False)
    slug          = Column(String(100), unique=True, nullable=False)
    contact_email = Column(String(255), unique=True, nullable=False)
    password      = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)