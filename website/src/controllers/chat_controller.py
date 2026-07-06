from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.chat_model import ChatSession, ChatMessage
import uuid

class ChatController:
    def get_sessions(self, db: Session, current_user: dict):
        student_id = current_user.get("user").id
        sessions = db.query(ChatSession).filter(ChatSession.student_id == student_id).order_by(ChatSession.created_at.desc()).all()
        return {"message": "Success", "data": sessions}

    def get_messages(self, session_id: str, db: Session, current_user: dict):
        student_id = current_user.get("user").id
        try:
            sess_uuid = uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session ID")

        session = db.query(ChatSession).filter(ChatSession.id == sess_uuid, ChatSession.student_id == student_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = db.query(ChatMessage).filter(ChatMessage.session_id == sess_uuid).order_by(ChatMessage.created_at.asc()).all()
        return {"message": "Success", "data": messages}

    def delete_session(self, session_id: str, db: Session, current_user: dict):
        student_id = current_user.get("user").id
        try:
            sess_uuid = uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session ID")

        session = db.query(ChatSession).filter(ChatSession.id == sess_uuid, ChatSession.student_id == student_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        db.delete(session)
        db.commit()
        return {"message": "Session deleted successfully"}

chat_controller = ChatController()
