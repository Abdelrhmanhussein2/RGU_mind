from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class StudySubjectRequest(BaseModel):
    name: str = Field(..., min_length=1)
    weight: float = Field(..., gt=0)


class DailyStudyPlannerRequest(BaseModel):
    total_hours: float = Field(..., gt=0)
    break_minutes: int = Field(..., ge=0)
    subjects: List[StudySubjectRequest] = Field(..., min_length=1)


class StudyPlanItemResponse(BaseModel):
    type: Literal["study", "break"]
    subject: Optional[str] = None
    minutes: int
    display_time: str


class DailyStudyPlannerResponse(BaseModel):
    total_minutes: int
    study_minutes: int
    break_minutes_total: int
    items: List[StudyPlanItemResponse]