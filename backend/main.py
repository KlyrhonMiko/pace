from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from routers import (
    users,
    courses,
    college_dept,
    student_records,
    alumni,
    alumni_skills,
    auth,
    jobs,
    event_types,
    events,
    event_registration,
    transaction_logs,
    surveys,
    survey_questions,
    survey_responses,
    alumni_surveys,
    questions,
    predict,
    regression,
    forecast,
    dashboard,
    otp,
    staff,
)
from core.config import settings
from models.response_codes import StandardResponse, ErrorCode
from utils.dev_auth import apply_dev_auth_override

app = FastAPI(title="Pasig Alumni and Career Employment (PACE) System", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply optional development auth bypass before router attachment.
apply_dev_auth_override(app)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(college_dept.router)
app.include_router(courses.router)
app.include_router(student_records.router)
app.include_router(alumni_surveys.router) # Specific alumni routes first
app.include_router(alumni.router)         # Generic alumni routes second
app.include_router(alumni_skills.router)
app.include_router(jobs.router)
app.include_router(event_types.router)
app.include_router(events.router)
app.include_router(event_registration.router)
app.include_router(transaction_logs.router)
app.include_router(surveys.router)
app.include_router(survey_questions.router)
app.include_router(survey_responses.router)
app.include_router(survey_responses.respond_router)
app.include_router(questions.router)
app.include_router(predict.router)
app.include_router(regression.router)
app.include_router(forecast.router)
app.include_router(dashboard.router)
app.include_router(otp.router)
app.include_router(staff.router)


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    try:
        print("[STARTUP] ✓ Application started - lazy caching enabled")
    except Exception as e:
        print(f"[STARTUP] ⚠ Failed to load jobs into cache: {e}")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle Pydantic validation errors and wrap in StandardResponse"""
    errors = exc.errors()

    # Extract the validation error details
    error_details = []
    error_code = ErrorCode.INVALID_INPUT.value

    for error in errors:
        field = error.get("loc", [])[-1]  # Get the field name
        msg = error.get("msg", "Invalid input")
        error_type = error.get("type", "")

        # Map validation errors to specific error codes
        if "email" in str(field).lower():
            error_code = ErrorCode.INVALID_EMAIL.value
        elif "password" in str(field).lower():
            error_code = ErrorCode.INVALID_PASSWORD.value
        elif "year_graduated" in str(field).lower():
            error_code = ErrorCode.INVALID_YEAR_GRADUATED.value
        elif "age" in str(field).lower():
            error_code = ErrorCode.INVALID_AGE.value

        error_details.append({"field": str(field), "message": msg, "type": error_type})

    # Create standardized error response
    response = StandardResponse(
        success=False,
        code=error_code,
        message=error_details[0]["message"] if error_details else "Validation error",
        data={"errors": error_details},
    )

    return JSONResponse(status_code=400, content=response.model_dump(mode="json"))


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Normalize HTTP errors into the StandardResponse envelope."""
    if isinstance(exc.detail, dict):
        # If the route already raised a StandardResponse-like payload, return it directly.
        if {"success", "code", "message"}.issubset(exc.detail.keys()):
            return JSONResponse(status_code=exc.status_code, content=exc.detail)

    if exc.status_code in (401, 403):
        message = exc.detail if isinstance(exc.detail, str) else "Unauthorized"
        code = ErrorCode.UNAUTHORIZED.value
        if "expired" in message.lower():
            code = ErrorCode.TOKEN_EXPIRED.value
        response = StandardResponse(success=False, code=code, message=message)
        return JSONResponse(status_code=401, content=response.model_dump(mode="json"))

    fallback = StandardResponse(
        success=False,
        code=ErrorCode.INVALID_INPUT.value,
        message=str(exc.detail) if exc.detail else "Request failed",
    )
    return JSONResponse(status_code=exc.status_code, content=fallback.model_dump(mode="json"))


@app.get("/")
def read_root():
    return {"message": "Hello from PACE Backend v3"}
