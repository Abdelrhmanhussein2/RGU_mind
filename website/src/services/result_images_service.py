import os
import re
import uuid
import base64
from sqlalchemy.orm import Session
from uuid import UUID
from models.result_image_model import ResultImage


class ResultImagesService:
    def get_result_images(self, student_id: str, db: Session):
        return db.query(ResultImage).filter(
            ResultImage.student_id == student_id
        ).order_by(ResultImage.uploaded_at.desc()).all()

    def add_result_image(self, student_id: str, term_name: str, image_base64: str, db: Session):
        try:
            image_path = self.save_base64_image(image_base64)
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {str(e)}")

        img = ResultImage(
            student_id=student_id,
            term_name=term_name,
            image_path=image_path
        )
        db.add(img)
        db.commit()
        db.refresh(img)
        return img

    def delete_result_image(self, image_id: UUID, student_id: str, db: Session):
        img = db.query(ResultImage).filter(
            ResultImage.id == image_id,
            ResultImage.student_id == student_id
        ).first()

        if not img:
            raise ValueError("Result image not found")

        if os.path.exists(img.image_path):
            try:
                os.remove(img.image_path)
            except Exception:
                pass

        db.delete(img)
        db.commit()

    def save_base64_image(self, base64_str: str) -> str:
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


result_images_service = ResultImagesService()
