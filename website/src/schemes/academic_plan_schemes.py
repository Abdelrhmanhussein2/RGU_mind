from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AcademicPlanCreate(BaseModel):
    facultyName: str
    departmentName: str
    totalRequiredCreditHours: int
    mandatoryCreditHours: int
    electiveCreditHours: int
    majorCreditHours: int
    curriculumPdfName: Optional[str] = None
    curriculumPdfBase64: Optional[str] = None

class AcademicPlanResponse(BaseModel):
    id: UUID
    facultyName: str
    departmentName: str
    totalRequiredCreditHours: int
    mandatoryCreditHours: int
    electiveCreditHours: int
    majorCreditHours: int
    curriculumPdfName: Optional[str] = None
    curriculumPdfPath: Optional[str] = None

    class Config:
        from_attributes = True
