from sqlalchemy.orm import Session
from uuid import UUID
from models.notification_model import NotificationItem


class NotificationsService:
    def get_notifications(self, student_id: str, db: Session):
        return db.query(NotificationItem).filter(
            NotificationItem.student_id == student_id
        ).order_by(NotificationItem.created_at.desc()).all()

    def mark_notification_read(self, notification_id: UUID, student_id: str, db: Session):
        n = db.query(NotificationItem).filter(
            NotificationItem.id == notification_id,
            NotificationItem.student_id == student_id
        ).first()

        if not n:
            raise ValueError("Notification not found")

        n.read = True
        db.commit()
        db.refresh(n)
        return n

    def mark_all_notifications_read(self, student_id: str, db: Session):
        db.query(NotificationItem).filter(
            NotificationItem.student_id == student_id,
            NotificationItem.read == False
        ).update({"read": True}, synchronize_session=False)

        db.commit()


notifications_service = NotificationsService()
