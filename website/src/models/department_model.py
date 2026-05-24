from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base


class Department(Base):
    __tablename__ = "department"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("faculty.id"), nullable=False)
    name       = Column(String(255), nullable=False)
    code       = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)