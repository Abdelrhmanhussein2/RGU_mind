from pydantic import BaseModel, EmailStr

class AdminCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminOtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class AdminProfileUpdateRequest(BaseModel):
    name: str
    email: EmailStr


class AdminRejectRegulationRequest(BaseModel):
    reason: str

