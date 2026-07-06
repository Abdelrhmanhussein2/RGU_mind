from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from helpers.config import get_db
from helpers.security import get_current_user
from controllers.chat_controller import chat_controller
from schemes.chat_schemes import ChatSessionListResponse, ChatMessageListResponse

chat_router = APIRouter()

@chat_router.get("/sessions", response_model=ChatSessionListResponse)
def get_sessions(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    response = chat_controller.get_sessions(db, current_user)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=jsonable_encoder(response)
    )

@chat_router.get("/sessions/{session_id}/messages", response_model=ChatMessageListResponse)
def get_messages(session_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    response = chat_controller.get_messages(session_id, db, current_user)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=jsonable_encoder(response)
    )

@chat_router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    response = chat_controller.delete_session(session_id, db, current_user)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=jsonable_encoder(response)
    )
