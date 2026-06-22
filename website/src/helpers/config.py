from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

POSTGRES_USER     = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin123")
POSTGRES_HOST     = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_DB       = os.getenv("POSTGRES_DB", "regumind")

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")

class Settings:
    FILE_ALLOWED_TYPES = os.getenv("FILE_ALLOWED_TYPES", "application/pdf,text/plain").split(",")
    FILE_MAX_SIZE_MB   = int(os.getenv("FILE_MAX_SIZE_MB", "50"))

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
