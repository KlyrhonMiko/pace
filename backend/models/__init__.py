from .base import BaseTable
from .users import User
from .courses import Course
from .college_dept import CollegeDept
from .student_records import StudentRecord
from .alumni import Alumni
from .alumni_skills import AlumniSkills
from .alumni_resumes import AlumniResume
from .skills import Skills, SkillsList
from .job_listings import JobListing, JobApplication
from .transaction_logs import TransactionLog
from .user_activities import UserActivity
from .mentoring import MentoringSession  # noqa: F401
from .event_types import EventType
from .events import Event, EventRegistration
from .questions import Question
from .surveys import (
    Survey, SurveyQuestion, SurveyResponse,
)
from .employability import EmployabilityPrediction
from .alumni_regression_prediction import AlumniRegressionPrediction
from .arima_forecast_result import ArimaForecastResult
from .staff import Staff
from .employers import Employer
from .notifications import Notification

__all__ = [
    # ORM table classes only — schemas live in schemas/
    "User",
    "BaseTable",
    "Course",
    "CollegeDept",
    "StudentRecord",
    "Alumni",
    "AlumniSkills",
    "AlumniResume",
    "Skills",
    "SkillsList",
    "JobListing",
    "JobApplication",
    "TransactionLog",
    "UserActivity",
    "EventType",
    "Event",
    "EventRegistration",
    "Question",
    "Survey",
    "SurveyQuestion",
    "SurveyResponse",
    "EmployabilityPrediction",
    "AlumniRegressionPrediction",
    "ArimaForecastResult",
    "Staff",
    "Employer",
    "Notification",
]
