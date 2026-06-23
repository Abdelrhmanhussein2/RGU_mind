# Import all models here so SQLAlchemy registers them with the shared Base
# before create_all() is called in main.py

from models.university_model import University
from models.faculty_model import Faculty
from models.department_model import Department
from models.user_model import Student
from models.regulation_model import Regulation
from models.document_model import Document
from models.chunk_model import Chunk
from models.admin_model import Admin
from models.student_profile_model import StudentProfile
from models.term_grades_model import TermGrades
from models.course_model import Course
from models.result_image_model import ResultImage
from models.notification_model import NotificationItem

__all__ = [
    "University",
    "Faculty",
    "Department",
    "Student",
    "Regulation",
    "Document",
    "Chunk",
    "Admin",
    "StudentProfile",
    "TermGrades",
    "Course",
    "ResultImage",
    "NotificationItem",
]
