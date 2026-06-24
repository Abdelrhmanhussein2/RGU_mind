import random
from helpers.security import hash_password, verify_password


OTP_TTL_SECONDS = 5 * 60


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def build_otp_key(purpose: str, role: str, email: str) -> str:
    return f"otp:{purpose}:{role}:{email.lower()}"


def hash_otp(otp: str) -> str:
    return hash_password(otp)


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    return verify_password(plain_otp, hashed_otp)