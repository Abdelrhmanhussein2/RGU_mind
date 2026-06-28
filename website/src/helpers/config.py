from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
from pathlib import Path
import os

# Load .env from src/ directory (two levels up from this file: helpers/config.py -> helpers/ -> src/)
_env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

POSTGRES_USER     = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin123")
POSTGRES_HOST     = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_DB       = os.getenv("POSTGRES_DB", "regumind")

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
GROQ_API_KEY = os.getenv("GROK_API_KEY")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT_NUM = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

class Settings:
    FILE_ALLOWED_TYPES = os.getenv("FILE_ALLOWED_TYPES", "application/pdf,text/plain").split(",")
    FILE_MAX_SIZE_MB   = int(os.getenv("FILE_MAX_SIZE_MB", "50"))
    JWT_SECRET_KEY     = os.getenv("JWT_SECRET_KEY", "super_secret_key_12345_rgumind")
    JWT_ALGORITHM      = os.getenv("JWT_ALGORITHM", "HS256")

settings = Settings()

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:5432/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
