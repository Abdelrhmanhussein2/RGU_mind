from sqlalchemy.orm import Session
from models.user_model import Student
from services.graduation_check_service import graduation_check_service


class GraduationCheckController:
    def check_graduation_eligibility_controller(self, student: Student, db: Session):
        return graduation_check_service.check_graduation_eligibility(student.id, db)


graduation_check_controller = GraduationCheckController()
