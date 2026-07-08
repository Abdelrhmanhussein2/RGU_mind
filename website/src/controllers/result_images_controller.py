import os
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from models.user_model import Student
from schemes.result_image_schemes import ResultImageCreate, ResultImageResponse
from services.result_images_service import result_images_service


class ResultImagesController:
    def get_result_images_controller(self, student: Student, db: Session):
        images = result_images_service.get_result_images(student.id, db)
        return [
            ResultImageResponse(
                id=str(img.id),
                termName=img.term_name,
                uploadDate=img.uploaded_at,
                imageUrl=f"/uploads/{os.path.basename(img.image_path)}"
            )
            for img in images
        ]

    def add_result_image_controller(self, image_req: ResultImageCreate, student: Student, db: Session):
        try:
            img = result_images_service.add_result_image(student.id, image_req.termName, image_req.imageBase64, db)
            return ResultImageResponse(
                id=str(img.id),
                termName=img.term_name,
                uploadDate=img.uploaded_at,
                imageUrl=f"/uploads/{os.path.basename(img.image_path)}"
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def delete_image_controller(self, image_id: UUID, student: Student, db: Session):
        try:
            result_images_service.delete_result_image(image_id, student.id, db)
            return None
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


result_images_controller = ResultImagesController()
