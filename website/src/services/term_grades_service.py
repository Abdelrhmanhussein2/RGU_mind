from sqlalchemy.orm import Session
from uuid import UUID
from models.user_model import Student
from models.term_grades_model import TermGrades
from models.course_model import Course
from schemes.term_grades_schemes import TermGradesCreate


class TermGradesService:
    def get_term_grades(self, student: Student, db: Session):
        return db.query(TermGrades).filter(
            TermGrades.student_id == student.id
        ).order_by(TermGrades.created_at.desc()).all()

    def add_term_grades(self, term_req: TermGradesCreate, student: Student, db: Session):
        existing_term = db.query(TermGrades).filter(
            TermGrades.student_id == student.id,
            TermGrades.term_name == term_req.termName
        ).first()

        if existing_term:
            db.delete(existing_term)
            db.commit()

        term = TermGrades(
            student_id=student.id,
            term_name=term_req.termName
        )
        db.add(term)
        db.commit()
        db.refresh(term)

        for c_req in term_req.courses:
            course = Course(
                term_id=term.id,
                course_name=c_req.courseName,
                credit_hours=c_req.creditHours,
                grade=c_req.grade,
                category=c_req.category
            )
            db.add(course)

        db.commit()
        db.refresh(term)
        return term

    def delete_term_grades(self, term_id: UUID, student: Student, db: Session):
        term = db.query(TermGrades).filter(
            TermGrades.id == term_id,
            TermGrades.student_id == student.id
        ).first()

        if not term:
            raise ValueError("Term not found")

        db.delete(term)
        db.commit()
        return True

    def delete_course_from_term(self, term_id: UUID, course_id: UUID, student: Student, db: Session):
        term = db.query(TermGrades).filter(
            TermGrades.id == term_id,
            TermGrades.student_id == student.id
        ).first()

        if not term:
            raise ValueError("Term not found")

        course = db.query(Course).filter(
            Course.id == course_id,
            Course.term_id == term_id
        ).first()

        if not course:
            raise ValueError("Course not found")

        db.delete(course)
        db.commit()
        return True


term_grades_service = TermGradesService()
