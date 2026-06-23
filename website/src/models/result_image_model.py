from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base


class ResultImage(Base):
    __tablename__ = "result_images"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id  = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    term_name   = Column(String(100), nullable=False)
    image_path  = Column(String(1000), nullable=False)  # Path to the file on disk
    uploaded_at = Column(DateTime, default=datetime.utcnow)
