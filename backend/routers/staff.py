from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from core.database import get_session
from models.response_codes import StandardResponse
from models.auth import CurrentUser
from schemas.staff import CompleteStaffRegistration
from services.queries.staff_queries import register_complete_staff
from utils.rbac import require_admin
from core.redis import invalidate_cache_namespaces

router = APIRouter(prefix="/staff", tags=["staff"])


@router.post("/register", response_model=StandardResponse)
def register_staff(
    data: CompleteStaffRegistration,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """
    Register a new staff or admin user with a profile.
    This is a composite endpoint that creates both the User and Staff records.
    """
    success, code, message, user_id, staff_id = register_complete_staff(
        session=session,
        username=data.username,
        email=data.email,
        password=data.password,  # already hashed by validator
        user_type=data.user_type,
        last_name=data.last_name,
        first_name=data.first_name,
        middle_name=data.middle_name,
        gender=data.gender,
        college_dept_id=data.college_dept_id
    )
 
    if success:
        invalidate_cache_namespaces("users", "staff")

    if not success:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=code,
                message=message
            ).model_dump(mode="json")
        )

    return StandardResponse(
        success=True,
        code=code,
        message=message,
        data={
            "user_id": user_id,
            "staff_id": staff_id
        }
    )
