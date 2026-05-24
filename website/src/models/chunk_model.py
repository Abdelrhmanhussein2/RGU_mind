from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime
from helpers.config import Base


class Chunk(Base):
    __tablename__ = "chunk"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("document.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content     = Column(Text, nullable=False)
    page_ref    = Column(String(50), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)