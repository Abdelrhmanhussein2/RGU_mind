from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base
from helpers.enums import Language


class Document(Base):
    __tablename__ = "document"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    regulation_id   = Column(UUID(as_uuid=True), ForeignKey("regulation.id"), nullable=False)
    filename        = Column(String(500), nullable=False)
    storage_path    = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    language        = Column(String(10), default=Language.ar)
    uploaded_at     = Column(DateTime, default=datetime.utcnow)