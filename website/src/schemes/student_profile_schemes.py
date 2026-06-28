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


class StudentProfileResponse(BaseModel):
    fullName: str
    studentId: str
    university: str
    faculty: str
    department: str
    enrollmentYear: int
    expectedGraduationYear: int
    totalRequiredCreditHours: int = 0
    mandatoryCreditHours: int = 0
    electiveCreditHours: int = 0
    majorCreditHours: int = 0
    curriculumPdfName: Optional[str] = None
    curriculumPdfPath: Optional[str] = None

    class Config:
        from_attributes = True
