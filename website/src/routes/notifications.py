from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from schemes.notification_schemes import NotificationResponse
from controllers.notifications_controller import notifications_controller

notifications_router = APIRouter()

@notifications_router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return notifications_controller.get_notifications_controller(student, db)


@notifications_router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return notifications_controller.mark_notification_read_controller(notification_id, student, db)


@notifications_router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return notifications_controller.mark_all_notifications_read_controller(student, db)

