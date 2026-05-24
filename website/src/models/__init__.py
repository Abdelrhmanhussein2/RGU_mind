# Import all models here so SQLAlchemy registers them with the shared Base
# before create_all() is called in main.py

from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department
from models.user_model import Student
from models.regulation_model import Regulation
from models.document_model import Document
from models.chunk_model import Chunk

__all__ = [
    "University",
    "Faculty",
    "Department",
    "Student",
    "Regulation",
    "Document",
    "Chunk",
]
