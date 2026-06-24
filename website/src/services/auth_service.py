
from sqlalchemy.orm import Session
from models.user_model import Student
from helpers.security import verify_password , hash_password
from models.university_model import University
from models.faculty_model import Faculty
from helpers.redis_client import redis_client
from helpers.otp import generate_otp, build_otp_key, hash_otp, verify_otp, OTP_TTL_SECONDS
from fastapi import HTTPException
import os
import shutil

class AuthService:
    def get_user_by_email_and_role(self, email: str, role: str, db: Session):
        if role == "student":
            return db.query(Student).filter(Student.email == email).first()

        if role == "university":
            return db.query(University).filter(University.contact_email == email).first()

        raise ValueError("Invalid role")
    

    def request_password_reset_otp(self, request, db: Session):
        user = self.get_user_by_email_and_role(request.email, request.role.value, db)

        if not user:
            raise ValueError("User not found")

        otp = generate_otp()
        otp_key = build_otp_key("forgot_password", request.role.value, request.email)
        redis_client.setex(
            otp_key,
            OTP_TTL_SECONDS,
            hash_otp(otp)
        )

        return {
            "message": "OTP sent successfully",
            "dev_otp": otp
        }
    def request_register_otp(self, email: str, role: str, db: Session):
        user = self.get_user_by_email_and_role(email, role, db)

        if not user:
            raise ValueError("User not found")

        otp = generate_otp()
        otp_key = build_otp_key("register", role, email)
        redis_client.setex(
            otp_key,
            OTP_TTL_SECONDS,
            hash_otp(otp)
        )

        return {
            "message": "Registration OTP sent successfully",
            "dev_otp": otp
        }
    
    def verify_register_otp(self, request, db: Session):
        user = self.get_user_by_email_and_role(request.email, request.role.value, db)

        if not user:
            raise ValueError("User not found")

        otp_key = build_otp_key("register", request.role.value, request.email)
        hashed_otp = redis_client.get(otp_key)

        if not hashed_otp:
            raise ValueError("OTP expired or not found")

        if not verify_otp(request.otp, hashed_otp):
            raise PermissionError("Invalid OTP")

        user.is_email_verified = True

        redis_client.delete(otp_key)

        db.commit()
        db.refresh(user)

        return {
            "message": "Email verified successfully"
        }
    def verify_password_reset_otp(self, request, db: Session):
        user = self.get_user_by_email_and_role(request.email, request.role.value, db)

        if not user:
            raise ValueError("User not found")

        otp_key = build_otp_key("forgot_password", request.role.value, request.email)
        hashed_otp = redis_client.get(otp_key)

        if not hashed_otp:
            raise ValueError("OTP expired or not found")

        if not verify_otp(request.otp, hashed_otp):
            raise PermissionError("Invalid OTP")

        return {
            "message": "OTP verified successfully"
        }
    
    def reset_password_with_otp(self, request, db: Session):
        user = self.get_user_by_email_and_role(request.email, request.role.value, db)

        if not user:
            raise ValueError("User not found")

        otp_key = build_otp_key("forgot_password", request.role.value, request.email)
        hashed_otp = redis_client.get(otp_key)

        if not hashed_otp:
            raise ValueError("OTP expired or not found")

        if not verify_otp(request.otp, hashed_otp):
            raise PermissionError("Invalid OTP")

        user.password = hash_password(request.new_password)

        redis_client.delete(otp_key)

        db.commit()
        db.refresh(user)

        return {
            "message": "Password reset successfully"
        }

    
    def register_student(self, request, db: Session):
        existing_student = db.query(Student).filter(Student.email == request.email).first()

        if existing_student:
            raise ValueError("Email already exists")
        
        university_id = None
        faculty_id = None

        if request.university_name:
            university = db.query(University).filter(University.name == request.university_name).first()
            if university:
                university_id = university.id
                
                if request.faculty:
                    faculty = db.query(Faculty).filter(
                        Faculty.name == request.faculty,
                        Faculty.university_id == university.id
                    ).first()
                    if faculty:
                        faculty_id = faculty.id

        student = Student(
            name=request.username,
            email=request.email,
            password=hash_password(request.password),
            university_id=university_id,
            faculty_id=faculty_id
        )

        db.add(student)
        db.commit()
        db.refresh(student)

        otp_result = self.request_register_otp(student.email, "student", db)

        return student, otp_result


    def login_student(self, request, db: Session):
        student = db.query(Student).filter(
            (Student.email == request.email_or_username) |
            (Student.name == request.email_or_username)
        ).first()

        if not student or not verify_password(request.password, student.password):
            raise PermissionError("Invalid email/username or password")
        if not student.is_email_verified:
            raise PermissionError("Please verify your email before logging in")
        return student


    def register_university(self, request, verification_file, db: Session):

        existing_university = db.query(University).filter(
            (University.contact_email == request.contact_email) |
            (University.slug == request.slug)
        ).first()

        if existing_university:
            raise ValueError("University email or slug already exists")

        # Save verification file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, verification_file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(verification_file.file, buffer)

        university = University(
            name=request.name,
            slug=request.slug,
            country=request.country,
            contact_email=request.contact_email,
            password=hash_password(request.password),
            verification_file_url=file_path,
            status="pending"
        )

        db.add(university)
        db.commit()
        db.refresh(university)

        otp_result = self.request_register_otp(university.contact_email, "university", db)

        return university, otp_result


    def login_university(self, request, db: Session):
        university = db.query(University).filter(
            (University.contact_email == request.email_or_username) |
            (University.name == request.email_or_username) |
            (University.slug == request.email_or_username)
        ).first()

        if not university or not verify_password(request.password, university.password):
            raise PermissionError("Invalid email/name/slug or password")
        if not university.is_email_verified:
            raise PermissionError("Please verify your email before logging in")
        if university.status.lower() != "approved":
            raise PermissionError("University account is pending approval by an admin.")

        return university
    

auth_service = AuthService()
