import os
import re
import uuid
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from helpers.config import get_db
from helpers.security import get_current_student
from models.user_model import Student
from models.result_image_model import ResultImage
from schemes.result_image_schemes import ResultImageCreate, ResultImageResponse

result_images_router = APIRouter()


def save_base64_image(base64_str: str) -> str:
    mime_match = re.match(r"data:(image/\w+);base64,", base64_str)
    if mime_match:
        mime_type = mime_match.group(1)
        ext = "." + mime_type.split("/")[1]
        base64_str = base64_str.split(",")[1]
    else:
        ext = ".png"
    file_data = base64.b64decode(base64_str)
    os.makedirs("uploads", exist_ok=True)
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("uploads", unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_data)
    return file_path


@result_images_router.get("/result-images", response_model=List[ResultImageResponse])
async def get_result_images(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    images = db.query(ResultImage).filter(ResultImage.student_id == student.id).order_by(ResultImage.uploaded_at.desc()).all()
    return [
        ResultImageResponse(
            id=str(img.id),
            termName=img.term_name,
            uploadDate=img.uploaded_at,
            imageUrl=f"/uploads/{os.path.basename(img.image_path)}"
        )
        for img in images
    ]


@result_images_router.post("/result-images", response_model=ResultImageResponse, status_code=status.HTTP_201_CREATED)
async def add_result_image(
    image_req: ResultImageCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        image_path = save_base64_image(image_req.imageBase64)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid base64 image data: {str(e)}")

    img = ResultImage(
        student_id=student.id,
        term_name=image_req.termName,
        image_path=image_path
    )
    db.add(img)
    db.commit()
    db.refresh(img)

    return ResultImageResponse(
        id=str(img.id),
        termName=img.term_name,
        uploadDate=img.uploaded_at,
        imageUrl=f"/uploads/{os.path.basename(img.image_path)}"
    )


@result_images_router.delete("/result-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: UUID,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    img = db.query(ResultImage).filter(
        ResultImage.id == image_id,
        ResultImage.student_id == student.id
    ).first()

    if not img:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result image not found")

    # Delete physical file
    if os.path.exists(img.image_path):
        try:
            os.remove(img.image_path)
        except Exception:
            pass

    db.delete(img)
    db.commit()
    return None
