from sqlalchemy.orm import Session
from sqlalchemy import func
from models.student_profile_model import StudentProfile
from models.term_grades_model import TermGrades
from models.academic_plan_model import AcademicPlan
from models.university_model import University

GRADE_POINTS = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "F": 0.0
}

class GraduationCheckService:
    def check_graduation_eligibility(self, student_id: str, db: Session):
        profile = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
        
        # Get all courses for student
        terms = db.query(TermGrades).filter(TermGrades.student_id == student_id).all()
        courses = []
        for term in terms:
            courses.extend(term.courses)

        # 1. GPA calculation
        total_points = 0.0
        total_hours = 0
        passed_hours = 0

        for c in courses:
            grade_val = c.grade.upper()
            pts = GRADE_POINTS.get(grade_val, 0.0)
            total_points += pts * c.credit_hours
            total_hours += c.credit_hours
            if grade_val != "F":
                passed_hours += c.credit_hours

        gpa = (total_points / total_hours) if total_hours > 0 else 0.0

        # Academic standing
        if len(courses) == 0:
            standing = "Not calculated yet"
        elif gpa >= 3.5:
            standing = "Excellent"
        elif gpa >= 3.0:
            standing = "Good"
        elif gpa >= 2.0:
            standing = "Satisfactory"
        else:
            standing = "Academic Warning"

        # Default profile values if not created
        plan = None
        if profile:
            plan = db.query(AcademicPlan).join(University, AcademicPlan.university_id == University.id).filter(
                func.lower(AcademicPlan.department_name) == func.lower(profile.department),
                func.lower(University.name) == func.lower(profile.university)
            ).first()

        total_req_hours = plan.total_required_credit_hours if plan else 0
        mandatory_req = plan.mandatory_credit_hours if plan else 0
        elective_req = plan.elective_credit_hours if plan else 0
        major_req = plan.major_credit_hours if plan else 0

        # Checks
        hours_check = passed_hours >= total_req_hours if total_req_hours > 0 else False
        gpa_check = gpa >= 2.0 if len(courses) > 0 else False

        # Proportional mandatory breakdown calculation
        if total_req_hours > 0:
            mandatory_share = mandatory_req / total_req_hours
            passed_mandatory = passed_hours * mandatory_share
            remaining_mandatory = max(0.0, mandatory_req - passed_mandatory)
            mandatory_check = remaining_mandatory <= 0.5
        else:
            remaining_mandatory = mandatory_req
            mandatory_check = False

        eligible = hours_check and gpa_check and mandatory_check

        # Status color code
        remaining_hours = max(0, total_req_hours - passed_hours)
        if eligible:
            status_color = "green"
        elif (not eligible) and gpa_check and mandatory_check and (remaining_hours <= 12) and (total_req_hours > 0):
            status_color = "yellow"
        else:
            status_color = "red"

        # Course breakdown
        if total_req_hours > 0:
            mandatory_passed = passed_hours * (mandatory_req / total_req_hours)
            elective_passed = passed_hours * (elective_req / total_req_hours)
            major_passed = passed_hours * (major_req / total_req_hours)
        else:
            mandatory_passed = 0.0
            elective_passed = 0.0
            major_passed = 0.0

        reasons = []
        if not hours_check:
            reasons.append(f"Missing {remaining_hours} credit hours (Passed: {passed_hours}/{total_req_hours})")
        if len(courses) == 0:
            reasons.append("No courses recorded")
        elif not gpa_check:
            reasons.append(f"Cumulative GPA is below 2.0 (Current: {gpa:.2f})")
        if total_req_hours > 0 and not mandatory_check:
            reasons.append(f"Missing mandatory requirements")

        return {
            "passedHours": passed_hours,
            "gpa": gpa,
            "standing": standing,
            "eligible": eligible,
            "status": status_color,
            "hoursCheck": hours_check,
            "gpaCheck": gpa_check,
            "mandatoryCheck": mandatory_check,
            "reasons": reasons,
            "breakdown": {
                "mandatory": {
                    "passed": round(mandatory_passed),
                    "remaining": max(0, mandatory_req - round(mandatory_passed))
                },
                "elective": {
                    "passed": round(elective_passed),
                    "remaining": max(0, elective_req - round(elective_passed))
                },
                "major": {
                    "passed": round(major_passed),
                    "remaining": max(0, major_req - round(major_passed))
                }
            }
        }


graduation_check_service = GraduationCheckService()
