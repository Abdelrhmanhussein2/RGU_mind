from pydantic import BaseModel, EmailStr
from typing import Optional
from helpers.enums import UserType
from fastapi import UploadFile
class studentSignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    university_name: Optional[str] = None
    faculty: Optional[str] = None

class universitySignupRequest(BaseModel):
    name:          str
    slug:          str
    country:       str
    contact_email: EmailStr
    password:      str



class LoginRequest(BaseModel):
    email_or_username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserType


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    role: UserType


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    role: UserType
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    role: UserType
    otp: str
    new_password: str

class VerifyRegisterOtpRequest(BaseModel):
    email: EmailStr
    role: UserType
    otp: str


class ResendRegisterOtpRequest(BaseModel):
    email: EmailStr
    role: UserType