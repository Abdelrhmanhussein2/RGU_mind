from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from helpers.config import Base
from helpers.enums import RegulationStatus


class Regulation(Base):
    __tablename__ = "regulation"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.id"), nullable=False)
    superseded_by = Column(UUID(as_uuid=True), ForeignKey("regulation.id"), nullable=True)
    title         = Column(String(500), nullable=False)
    version       = Column(String(50), nullable=True)
    status        = Column(Enum(RegulationStatus), nullable=False, default=RegulationStatus.draft)
    rejection_reason = Column(String(1000), nullable=True)
    reviewed_at    = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)