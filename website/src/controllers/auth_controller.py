from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.auth_service import auth_service
from helpers.security import create_access_token


class AuthController:
    def register_student_controller(self, request, db: Session):
        try:
            student, otp_result = auth_service.register_student(request, db)
            token = create_access_token(data={"sub": str(student.id), "role": "student"})
            return {
                "message": "student registered successfully",
                "token": token,
                "dev_otp": otp_result["dev_otp"],
                "user": {
                    "id": str(student.id),
                    "name": student.name,
                    "email": student.email,
                    "role": "student",
                    "university_id": str(student.university_id) if student.university_id else None,
                    "faculty_id": str(student.faculty_id) if student.faculty_id else None
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except FileNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    def login_controller(self, request, db: Session):
        try:
            student = auth_service.login_student(request, db)
            token = create_access_token(data={"sub": str(student.id), "role": "student"})
            return {
                "message": "login successful",
                "token": token,
                "user": {
                    "id": str(student.id),
                    "name": student.name,
                    "email": student.email,
                    "role": "student"
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


    def register_university_controller(self, request, verification_file, db: Session):
        try:
            university, otp_result = auth_service.register_university(request, verification_file, db)
            token = create_access_token(data={"sub": str(university.id), "role": "university"})
            return {
                "message": "university registered successfully",
                "token": token,
                "dev_otp": otp_result["dev_otp"],
                "user": {
                    "id": str(university.id),
                    "name": university.name,
                    "slug": university.slug,
                    "country": university.country,
                    "email": university.contact_email,
                    "role": "university"
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


    def login_university_controller(self, request, db: Session):
        try:
            university = auth_service.login_university(request, db)
            token = create_access_token(data={"sub": str(university.id), "role": "university"})
            return {
                "message": "university login successful",
                "token": token,
                "user": {
                    "id": str(university.id),
                    "name": university.name,
                    "slug": university.slug,
                    "country": university.country,
                    "email": university.contact_email,
                    "role": "university"
                }
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    def forgot_password_controller(self, request, db: Session):
        try:
            return auth_service.request_password_reset_otp(request, db)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


    def verify_otp_controller(self, request, db: Session):
        try:
            return auth_service.verify_password_reset_otp(request, db)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


    def reset_password_controller(self, request, db: Session):
        try:
            return auth_service.reset_password_with_otp(request, db)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        
    def verify_register_otp_controller(self, request, db: Session):
        try:
            return auth_service.verify_register_otp(request, db)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    def resend_register_otp_controller(self, request, db: Session):
        try:
            return auth_service.request_register_otp(request.email, request.role.value, db)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        
auth_controller = AuthController()
