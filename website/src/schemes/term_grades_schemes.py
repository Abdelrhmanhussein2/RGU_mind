from pydantic import BaseModel
from typing import List
from datetime import datetime


class CourseBase(BaseModel):
    courseName: str
    creditHours: int
    grade: str


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: str

    class Config:
        from_attributes = True


class TermGradesCreate(BaseModel):
    termName: str
    courses: List[CourseCreate]


class TermGradesResponse(BaseModel):
    id: str
    termName: str
    createdDate: datetime
    courses: List[CourseResponse]

    class Config:
        from_attributes = True
