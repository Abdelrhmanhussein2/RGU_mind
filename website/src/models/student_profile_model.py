from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from helpers.config import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id                          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id                  = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id_code             = Column(String(100), nullable=False)
    university                  = Column(String(255), nullable=False)
    faculty                     = Column(String(255), nullable=False)
    department                  = Column(String(255), nullable=False)
    enrollment_year             = Column(Integer, nullable=False)
    expected_graduation_year    = Column(Integer, nullable=False)
    total_required_credit_hours = Column(Integer, default=0, nullable=False)
    mandatory_credit_hours      = Column(Integer, default=0, nullable=False)
    elective_credit_hours       = Column(Integer, default=0, nullable=False)
    major_credit_hours          = Column(Integer, default=0, nullable=False)
    curriculum_pdf_name         = Column(String(500), nullable=True)
    curriculum_pdf_path         = Column(String(1000), nullable=True)
