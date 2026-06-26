from sqlalchemy.orm import Session
from fastapi import FastAPI, APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from helpers.config import get_db
from fastapi.encoders import jsonable_encoder
from schemes.retreival_schemes import retrievalRequest, retrievalResponse, retrievalListResponse, augmentedListResponse
from controllers.answer_controller import answer_controllerr
from helpers.security import get_current_user
from models.student_profile_model import StudentProfile
from models.department_model import Department


rerival_router=APIRouter()

# @rerival_router.post("/search",response_model=retrievalListResponse)
# def retrieve_router(request:retrievalRequest, db:Session=Depends(get_db)):
#     response= retrievall_controller.retrieval_controller(request,db)
#     return JSONResponse(
#                status_code=status.HTTP_200_OK,
#                content={"data": jsonable_encoder(response), "message": "Success"}
#     )

@rerival_router.post("/answer",response_model=augmentedListResponse)
def answer_router(request:retrievalRequest, db:Session=Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not request.department_id:
        user = current_user.get("user")
        role = current_user.get("role")
        
        if role == "student":
            profile = db.query(StudentProfile).filter(StudentProfile.student_id == user.id).first()
            if not profile:
                raise HTTPException(status_code=400, detail="Student profile not found. Cannot determine department.")
                
            department = db.query(Department).filter(
                Department.faculty_id == user.faculty_id,
                Department.name == profile.department
            ).first()
            
            if not department:
                raise HTTPException(status_code=400, detail="Department not found for the student's profile.")
                
            request.department_id = department.id
        else:
            raise HTTPException(status_code=400, detail="department_id is required for non-student users.")

    response = answer_controllerr.answer(request,db)
    return JSONResponse(
               status_code=status.HTTP_200_OK,
               content={"data": jsonable_encoder(response), "message": "Success"}
    )