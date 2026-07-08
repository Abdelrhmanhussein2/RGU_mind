from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from helpers.config import Base


class Course(Base):
    __tablename__ = "courses"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    term_id      = Column(UUID(as_uuid=True), ForeignKey("term_grades.id", ondelete="CASCADE"), nullable=False)
    course_name  = Column(String(255), nullable=False)
    credit_hours = Column(Integer, nullable=False)
    grade        = Column(String(10), nullable=False)  # A+, A, A-, B+, etc.
    category     = Column(String(50), nullable=False, default="Mandatory")

    # Relationship to term model
    term = relationship("TermGrades", back_populates="courses")
