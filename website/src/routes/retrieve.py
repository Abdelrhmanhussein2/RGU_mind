from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from helpers.config import get_db
from fastapi.encoders import jsonable_encoder
from schemes.retreival_schemes import retrievalRequest, augmentedListResponse
from controllers.answer_controller import answer_controllerr
from helpers.security import get_current_user

rerival_router=APIRouter()

@rerival_router.post("/answer",response_model=augmentedListResponse)
def answer_router(request:retrievalRequest, db:Session=Depends(get_db), current_user: dict = Depends(get_current_user)):
    response = answer_controllerr.answer(request, db, current_user)
    return JSONResponse(
               status_code=status.HTTP_200_OK,
               content={"data": jsonable_encoder(response), "message": "Success"}
    )