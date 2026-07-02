from fastapi import HTTPException, status


class StudyPlannerService:
    def _format_minutes(self, minutes: int) -> str:
        hours = minutes // 60
        remaining_minutes = minutes % 60

        if hours > 0 and remaining_minutes > 0:
            return f"{hours}h {remaining_minutes}m"

        if hours > 0:
            return f"{hours}h"

        return f"{remaining_minutes}m"

    def generate_daily_plan(self, request):
        total_minutes = round(request.total_hours * 60)
        subjects_count = len(request.subjects)

        breaks_count = max(subjects_count - 1, 0)
        break_minutes_total = breaks_count * request.break_minutes

        if break_minutes_total >= total_minutes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Break time must be less than total available time"
            )

        study_minutes = total_minutes - break_minutes_total
        total_weight = sum(subject.weight for subject in request.subjects)

        items = []
        allocated_minutes_sum = 0

        for index, subject in enumerate(request.subjects):
            if index == subjects_count - 1:
                subject_minutes = study_minutes - allocated_minutes_sum
            else:
                subject_minutes = round((subject.weight / total_weight) * study_minutes)
                allocated_minutes_sum += subject_minutes

            items.append({
                "type": "study",
                "subject": subject.name,
                "minutes": subject_minutes,
                "display_time": self._format_minutes(subject_minutes)
            })

            if index < subjects_count - 1 and request.break_minutes > 0:
                items.append({
                    "type": "break",
                    "subject": None,
                    "minutes": request.break_minutes,
                    "display_time": self._format_minutes(request.break_minutes)
                })

        return {
            "total_minutes": total_minutes,
            "study_minutes": study_minutes,
            "break_minutes_total": break_minutes_total,
            "items": items
        }


study_planner_service = StudyPlannerService()