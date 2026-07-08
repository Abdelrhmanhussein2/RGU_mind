from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from schemes.result_image_schemes import ResultImageCreate, ResultImageResponse
from controllers.result_images_controller import result_images_controller


result_images_router = APIRouter()


@result_images_router.get("/result-images", response_model=List[ResultImageResponse])
async def get_result_images(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return result_images_controller.get_result_images_controller(student, db)


@result_images_router.post("/result-images", response_model=ResultImageResponse, status_code=status.HTTP_201_CREATED)
async def add_result_image(
    image_req: ResultImageCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return result_images_controller.add_result_image_controller(image_req, student, db)


@result_images_router.delete("/result-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return result_images_controller.delete_image_controller(image_id, student, db)

