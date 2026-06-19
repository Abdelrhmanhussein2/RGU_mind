from pydantic import BaseModel, EmailStr

class AdminCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
