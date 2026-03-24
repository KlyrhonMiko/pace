from .users import User
from .courses import Course
from .college_dept import CollegeDept
from .student_records import StudentRecord
from .alumni import Alumni
from .alumni_skills import AlumniSkills
from .skills import Skills, SkillsList
from .job_listings import JobListing
from .transaction_logs import TransactionLog
from .user_activities import UserActivity
from .event_types import EventType
from .events import Event, EventRegistration
from .questions import Question
from .surveys import (
    Survey, SurveyQuestion, SurveyResponse, SurveyAnswer,
    SurveyInvitation, SurveyDistributionConfig,
)
from .employability import EmployabilityPrediction

__all__ = [
    # ORM table classes only — schemas live in schemas/
    "User",
    "Course",
    "CollegeDept",
    "StudentRecord",
    "Alumni",
    "AlumniSkills",
    "Skills",
    "SkillsList",
    "JobListing",
    "TransactionLog",
    "UserActivity",
    "EventType",
    "Event",
    "EventRegistration",
    "Question",
    "Survey",
    "SurveyQuestion",
    "SurveyResponse",
    "SurveyAnswer",
    "SurveyInvitation",
    "SurveyDistributionConfig",
    "EmployabilityPrediction"
]
