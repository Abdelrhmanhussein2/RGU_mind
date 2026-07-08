from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from services.term_grades_service import term_grades_service
from schemes.term_grades_schemes import TermGradesCreate, TermGradesResponse, CourseResponse
from models.user_model import Student


class TermGradesController:
    def get_term_grades_controller(self, student: Student, db: Session):
        terms = term_grades_service.get_term_grades(student, db)
        response = []
        for term in terms:
            courses = [
                CourseResponse(
                    id=str(c.id),
                    courseName=c.course_name,
                    creditHours=c.credit_hours,
                    grade=c.grade,
                    category=c.category
                )
                for c in term.courses
            ]
            response.append(
                TermGradesResponse(
                    id=str(term.id),
                    termName=term.term_name,
                    createdDate=term.created_at,
                    courses=courses
                )
            )
        return response

    def add_term_grades_controller(self, term_req: TermGradesCreate, student: Student, db: Session):
        term = term_grades_service.add_term_grades(term_req, student, db)
        
        courses = [
            CourseResponse(
                id=str(c.id),
                courseName=c.course_name,
                creditHours=c.credit_hours,
                grade=c.grade,
                category=c.category
            )
            for c in term.courses
        ]

        return TermGradesResponse(
            id=str(term.id),
            termName=term.term_name,
            createdDate=term.created_at,
            courses=courses
        )

    def delete_term_controller(self, term_id: UUID, student: Student, db: Session):
        try:
            term_grades_service.delete_term_grades(term_id, student, db)
            return None
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    def delete_course_from_term_controller(self, term_id: UUID, course_id: UUID, student: Student, db: Session):
        try:
            term_grades_service.delete_course_from_term(term_id, course_id, student, db)
            return None
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


term_grades_controller = TermGradesController()
