from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from models.user_model import Student
from schemes.notification_schemes import NotificationResponse
from services.notifications_service import notifications_service


class NotificationsController:
    def get_notifications_controller(self, student: Student, db: Session):
        notifications = notifications_service.get_notifications(student.id, db)
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

    def mark_notification_read_controller(self, notification_id: UUID, student: Student, db: Session):
        try:
            n = notifications_service.mark_notification_read(notification_id, student.id, db)
            return NotificationResponse(
                id=str(n.id),
                title=n.title,
                message=n.message,
                timestamp=n.created_at,
                read=n.read
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    def mark_all_notifications_read_controller(self, student: Student, db: Session):
        notifications_service.mark_all_notifications_read(student.id, db)
        return None


notifications_controller = NotificationsController()
