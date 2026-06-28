
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
import json

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

        print(f"\n[DEV ONLY] Password Reset OTP for {request.email}: {otp}\n", flush=True)
        from helpers.email import send_otp_email
        send_otp_email(request.email, otp, purpose="Password Reset")

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

        print(f"\n[DEV ONLY] Registration OTP for {email}: {otp}\n", flush=True)
        from helpers.email import send_otp_email
        send_otp_email(email, otp, purpose="Registration")

        return {
            "message": "Registration OTP sent successfully",
            "dev_otp": otp
        }

    
    def verify_register_otp(self, request, db: Session):
        email_lower = request.email.lower()
        role = request.role.value

        otp_key = build_otp_key("register", role, email_lower)
        hashed_otp = redis_client.get(otp_key)

        if not hashed_otp:
            raise ValueError("OTP expired or not found")

        if not verify_otp(request.otp, hashed_otp):
            raise PermissionError("Invalid OTP")

        # OTP is valid — now create the user in the DB if student
        user = None
        if role == "student":
            pending_key = f"pending_registration:student:{email_lower}"
            pending_data_raw = redis_client.get(pending_key)
            if pending_data_raw:
                pending_data = json.loads(pending_data_raw)
                existing = db.query(Student).filter(Student.email == email_lower).first()
                if not existing:
                    student = Student(
                        name=pending_data["name"],
                        email=pending_data["email"],
                        password=pending_data["password"],
                        university_id=pending_data.get("university_id"),
                        faculty_id=pending_data.get("faculty_id"),
                        is_email_verified=True
                    )
                    db.add(student)
                    db.commit()
                    db.refresh(student)
                    user = student
                else:
                    existing.is_email_verified = True
                    db.commit()
                    user = existing
                redis_client.delete(pending_key)
            else:
                # Fallback: student already in DB (old flow or resend scenario)
                user = db.query(Student).filter(Student.email == email_lower).first()
                if user:
                    user.is_email_verified = True
                    db.commit()

        elif role == "university":
            user = db.query(University).filter(University.contact_email == email_lower).first()
            if user:
                user.is_email_verified = True
                db.commit()

        redis_client.delete(otp_key)

        if not user:
            raise ValueError("Failed to create or find user during verification")

        return user, {
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
        email_lower = request.email.lower()

        # Check if email already exists and is verified
        existing_student = db.query(Student).filter(Student.email == email_lower).first()
        if existing_student and existing_student.is_email_verified:
            raise ValueError("Email already exists")

        # If unverified record exists, remove it so we can re-register cleanly
        if existing_student and not existing_student.is_email_verified:
            db.delete(existing_student)
            db.commit()

        university_id = None
        faculty_id = None

        if request.university_name:
            uni_name = request.university_name.strip()
            university = db.query(University).filter(University.name.ilike(uni_name)).first()
            if not university:
                clean_name = uni_name.lower().replace("university", "").strip()
                university = db.query(University).filter(University.name.ilike(f"%{clean_name}%")).first()
            if university:
                university_id = university.id
                if request.faculty:
                    fac_name = request.faculty.strip()
                    faculty = db.query(Faculty).filter(
                        Faculty.name.ilike(fac_name),
                        Faculty.university_id == university.id
                    ).first()
                    if not faculty:
                        clean_fac = fac_name.lower().replace("faculty of", "").replace("faculty", "").strip()
                        faculty = db.query(Faculty).filter(
                            Faculty.name.ilike(f"%{clean_fac}%"),
                            Faculty.university_id == university.id
                        ).first()
                    if faculty:
                        faculty_id = faculty.id

        # Store registration data in Redis temporarily (NOT in DB yet)
        pending_key = f"pending_registration:student:{email_lower}"
        pending_data = {
            "name": request.username,
            "email": email_lower,
            "password": hash_password(request.password),
            "university_id": str(university_id) if university_id else None,
            "faculty_id": str(faculty_id) if faculty_id else None,
        }
        redis_client.setex(pending_key, OTP_TTL_SECONDS, json.dumps(pending_data))

        # Generate OTP and send email
        otp = generate_otp()
        otp_key = build_otp_key("register", "student", email_lower)
        redis_client.setex(otp_key, OTP_TTL_SECONDS, hash_otp(otp))

        print(f"\n[DEV ONLY] Registration OTP for {email_lower}: {otp}\n", flush=True)
        from helpers.email import send_otp_email
        send_otp_email(email_lower, otp, purpose="Registration")

        return None, {"message": "Registration OTP sent successfully", "dev_otp": otp}



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
            (University.contact_email == request.contact_email.lower()) |
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
            contact_email=request.contact_email.lower(),
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
