from pydantic import BaseModel
from typing import Optional


class StudentProfileRequest(BaseModel):
    fullName: str
    studentId: str
    university: str
    faculty: str
    department: str
    enrollmentYear: int
    expectedGraduationYear: int
    totalRequiredCreditHours: int
    mandatoryCreditHours: int
    electiveCreditHours: int
    majorCreditHours: int
    curriculumPdfName: Optional[str] = None
    curriculumPdfBase64: Optional[str] = None


class StudentProfileResponse(BaseModel):
    fullName: str
    studentId: str
    university: str
    faculty: str
    department: str
    enrollmentYear: int
    expectedGraduationYear: int
    totalRequiredCreditHours: int
    mandatoryCreditHours: int
    electiveCreditHours: int
    majorCreditHours: int
    curriculumPdfName: Optional[str] = None

    class Config:
        from_attributes = True
