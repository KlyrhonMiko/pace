from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from schemas.employers import EmployerCreate, EmployerResponse
from models.users import UserType
from models.response_codes import ErrorCode, SuccessCode, StandardResponse

from services.queries.users_queries import create_user
from services.queries.employers_queries import create_employer_profile
from schemas.users import UserCreate

router = APIRouter(prefix="/employers", tags=["employers"])

@router.post("/register", response_model=StandardResponse)
def register_employer(
    employer_data: EmployerCreate,
    session: Session = Depends(get_session)
):
    """Register a new Employer account and their company profile"""
    try:
        # 1. Create base user
        new_user = create_user(
            session,
            UserCreate(
                username=employer_data.username,
                email=employer_data.email,
                password=employer_data.password,
                user_type=UserType.EMPLOYER.value
            )
        )
        
        # 2. Create Employer profile
        employer_profile = create_employer_profile(
            session,
            user_code=new_user.user_code,
            company_name=employer_data.company_name,
            contact_person_first_name=employer_data.contact_person_first_name,
            contact_person_last_name=employer_data.contact_person_last_name,
            contact_person_position=employer_data.contact_person_position,
            company_website=employer_data.company_website,
            company_address=employer_data.company_address
        )
        
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_CREATED.value,
            message="Employer account created successfully",
            data=EmployerResponse.model_validate(employer_profile)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "users_email_key" in error_str or "ix_users_email" in error_str:
            raise HTTPException(status_code=400, detail=StandardResponse(
                success=False, code=ErrorCode.DUPLICATE_EMAIL.value, message="Email already in use"
            ).model_dump(mode='json'))
        elif "users_username_key" in error_str or "ix_users_username" in error_str:
            raise HTTPException(status_code=400, detail=StandardResponse(
                success=False, code=ErrorCode.DUPLICATE_USERNAME.value, message="Username already in use"
            ).model_dump(mode='json'))
        else:
            raise HTTPException(status_code=400, detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message="Registration failed"
            ).model_dump(mode='json'))
