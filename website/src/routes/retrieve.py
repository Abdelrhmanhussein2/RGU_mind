from sqlalchemy.orm import Session
from fastapi import FastAPI, APIRouter, Depends, status
from fastapi.responses import JSONResponse
from helpers.config import get_db
from fastapi.encoders import jsonable_encoder
from schemes.retreival_schemes import retrievalRequest, retrievalResponse, retrievalListResponse
from controllers.retrieval_controller import retrievall_controller


rerival_router=APIRouter()

@rerival_router.post("/search",response_model=retrievalListResponse)
def retrieve_router(request:retrievalRequest, db:Session=Depends(get_db)):
    response= retrievall_controller.retrieval_controller(request,db)
    return JSONResponse(
               status_code=status.HTTP_200_OK,
               content={"data": jsonable_encoder(response), "message": "Success"}
    )