from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from routers import users, courses, college_dept, student_records, alumni, auth, jobs, events, event_registration, surveys, questions, predict
from core.config import settings
from models.response_codes import StandardResponse, ErrorCode
from datetime import datetime
from utils.timezone import get_current_time_gmt8

app = FastAPI(
    title="Pasig Alumni and Career Employment (PACE) System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(college_dept.router)
app.include_router(courses.router)
app.include_router(student_records.router)
app.include_router(alumni.router)
app.include_router(jobs.router)
app.include_router(events.router)
app.include_router(surveys.router)
app.include_router(questions.router)
app.include_router(predict.router)

# TODO: Add event_registration router once auth and RBAC are implemented
# app.include_router(event_registration.router)


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    try:
        print(f"[STARTUP] ✓ Application started - lazy caching enabled")
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
        field = error.get('loc', [])[-1]  # Get the field name
        msg = error.get('msg', 'Invalid input')
        error_type = error.get('type', '')
        
        # Map validation errors to specific error codes
        if 'email' in str(field).lower():
            error_code = ErrorCode.INVALID_EMAIL.value
        elif 'password' in str(field).lower():
            error_code = ErrorCode.INVALID_PASSWORD.value
        elif 'year_graduated' in str(field).lower():
            error_code = ErrorCode.INVALID_YEAR_GRADUATED.value
        elif 'age' in str(field).lower():
            error_code = ErrorCode.INVALID_AGE.value
        
        error_details.append({
            'field': str(field),
            'message': msg,
            'type': error_type
        })
    
    # Create standardized error response
    response = StandardResponse(
        success=False,
        code=error_code,
        message=error_details[0]['message'] if error_details else 'Validation error',
        data={'errors': error_details}
    )
    
    return JSONResponse(
        status_code=400,
        content=response.model_dump(mode='json')
    )


@app.get("/")
def read_root():
    return {"message": "Hello from PACE Backend v3"}


