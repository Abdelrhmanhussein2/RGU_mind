from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base


class Student(Base):
    __tablename__ = "students"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password      = Column(String, nullable=False)
    university_id = Column(UUID(as_uuid=True), ForeignKey("university.id"), nullable=True)
    faculty_id    = Column(UUID(as_uuid=True), ForeignKey("faculty.id"), nullable=True)
    is_active          = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    created_at         = Column(DateTime, default=datetime.utcnow)