from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from helpers.config import Base


class AcademicPlan(Base):
    __tablename__ = "academic_plans"

    id                          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_name                = Column(String(255), unique=True, nullable=False)
    total_required_credit_hours = Column(Integer, default=0, nullable=False)
    mandatory_credit_hours      = Column(Integer, default=0, nullable=False)
    elective_credit_hours       = Column(Integer, default=0, nullable=False)
    major_credit_hours          = Column(Integer, default=0, nullable=False)
    curriculum_pdf_name         = Column(String(500), nullable=True)
    curriculum_pdf_path         = Column(String(1000), nullable=True)
