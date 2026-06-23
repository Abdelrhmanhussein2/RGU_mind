from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from models.notification_model import NotificationItem
from schemes.notification_schemes import NotificationResponse

notifications_router = APIRouter()


@notifications_router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    notifications = db.query(NotificationItem).filter(
        NotificationItem.student_id == student.id
    ).order_by(NotificationItem.created_at.desc()).all()

    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            message=n.message,
            timestamp=n.created_at,
            read=n.read
        )
        for n in notifications
    ]


@notifications_router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    n = db.query(NotificationItem).filter(
        NotificationItem.id == notification_id,
        NotificationItem.student_id == student.id
    ).first()

    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    n.read = True
    db.commit()
    db.refresh(n)

    return NotificationResponse(
        id=str(n.id),
        title=n.title,
        message=n.message,
        timestamp=n.created_at,
        read=n.read
    )


@notifications_router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    db.query(NotificationItem).filter(
        NotificationItem.student_id == student.id,
        NotificationItem.read == False
    ).update({"read": True}, synchronize_session=False)

    db.commit()
    return None
