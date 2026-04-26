from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from schemas.employers import EmployerCreate, EmployerResponse, EmployerUpdate
from models.users import User, UserType
from models.auth import CurrentUser
from models.response_codes import ErrorCode, SuccessCode, StandardResponse

from services.queries.users_queries import create_user
from services.queries.employers_queries import (
    create_employer_profile,
    get_employer_by_user_ref_id,
    update_employer_logo,
    update_employer_profile,
)
from services.queries.jobs_queries import (
    get_employer_applications,
    get_job_application_by_ref_id,
    get_job_listing,
    update_job_application_status,
)
from models.alumni import Alumni
from models.job_listings import JobApplication
from schemas.users import UserCreate
from utils.auth import get_current_user
import uuid
import cloudinary
import cloudinary.uploader
from core.config import settings

router = APIRouter(prefix="/employers", tags=["employers"])

if settings.CLOUDINARY_URL:
    cloudinary.config(url=settings.CLOUDINARY_URL)

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
            user_ref_id=new_user.id,
            company_name=employer_data.company_name,
            contact_person_first_name=employer_data.contact_person_first_name,
            contact_person_last_name=employer_data.contact_person_last_name,
            contact_person_position=employer_data.contact_person_position,
            company_website=employer_data.company_website,
            company_address=employer_data.company_address
            ,
            company_contact_number=employer_data.company_contact_number,
            performed_by=new_user.id,
        )
        
        # Manually assemble EmployerResponse since it now needs user fields
        response_data = EmployerResponse(
            id=employer_profile.id,
            user_id=new_user.user_id,
            username=new_user.username,
            email=new_user.email,
            company_name=employer_profile.company_name,
            contact_person_first_name=employer_profile.contact_person_first_name,
            contact_person_last_name=employer_profile.contact_person_last_name,
            contact_person_position=employer_profile.contact_person_position,
            company_website=employer_profile.company_website,
            company_address=employer_profile.company_address,
            company_contact_number=employer_profile.company_contact_number,
            company_logo_url=employer_profile.company_logo_url
        )

        return StandardResponse(
            success=True,
            code=SuccessCode.USER_CREATED.value,
            message="Employer account created successfully",
            data=response_data
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

@router.get("/me", response_model=StandardResponse)
def get_employer_me(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Fetch the current authenticated employer's profile details."""
    if current_user.user_type != UserType.EMPLOYER.value:
        raise HTTPException(status_code=403, detail="Only employers can access this profile.")
    
    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id.")
    employer_profile = get_employer_by_user_ref_id(session, current_user.id)
    if not employer_profile:
        raise HTTPException(status_code=404, detail="Employer profile not found.")
    
    # Get associated user for username and email
    user = session.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
         raise HTTPException(status_code=404, detail="User account not found.")

    response_data = EmployerResponse(
        id=employer_profile.id,
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        company_name=employer_profile.company_name,
        contact_person_first_name=employer_profile.contact_person_first_name,
        contact_person_last_name=employer_profile.contact_person_last_name,
        contact_person_position=employer_profile.contact_person_position,
        company_website=employer_profile.company_website,
        company_address=employer_profile.company_address,
        company_contact_number=employer_profile.company_contact_number,
        company_logo_url=employer_profile.company_logo_url
    )

    return StandardResponse(
        success=True,
        code=SuccessCode.USER_RETRIEVED.value if hasattr(SuccessCode, 'USER_RETRIEVED') else SuccessCode.USERS_RETRIEVED.value,
        message="Employer profile retrieved successfully",
        data=response_data
    )

@router.post("/upload-logo", response_model=StandardResponse)
def upload_employer_logo(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Upload a company logo to Cloudinary and update the Employer profile."""
    if current_user.user_type != UserType.EMPLOYER.value:
        raise HTTPException(status_code=403, detail="Only employers can upload logos.")

    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id.")
    employer_profile = get_employer_by_user_ref_id(session, current_user.id)
    if not employer_profile:
        raise HTTPException(status_code=404, detail="Employer profile not found.")

    if not settings.CLOUDINARY_URL:
        raise HTTPException(status_code=500, detail="Cloudinary integration is not configured.")

    try:
        if employer_profile.company_logo_public_id:
            try:
                cloudinary.uploader.destroy(employer_profile.company_logo_public_id)
            except Exception as e:
                print(f"Failed to delete old image by public_id: {e}")
        elif employer_profile.company_logo_url:
            try:
                url_parts = employer_profile.company_logo_url.split('/')
                if 'upload' in url_parts:
                    upload_index = url_parts.index('upload')
                    path_parts = url_parts[upload_index+2:]
                    public_id_with_ext = '/'.join(path_parts)
                    public_id = public_id_with_ext.rsplit('.', 1)[0]
                    cloudinary.uploader.destroy(public_id)
            except Exception as e:
                print(f"Failed to delete old image by URL fallback: {e}")

        result = cloudinary.uploader.upload(
            file.file, 
            folder=f"pace/employers/{employer_profile.id}",
            resource_type="image"
        )
        logo_url = result.get("secure_url")
        public_id = result.get("public_id")
        
        update_employer_logo(
            session,
            employer_profile,
            logo_url,
            public_id,
            performed_by=current_user.id,
        )

        return StandardResponse(
            success=True,
            code=SuccessCode.USER_UPDATED.value if hasattr(SuccessCode, 'USER_UPDATED') else 200,
            message="Logo uploaded successfully",
            data={"logo_url": logo_url}
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/me", response_model=StandardResponse)
def update_employer_me(
    employer_data: EmployerUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update the current authenticated employer's profile details."""
    if current_user.user_type != UserType.EMPLOYER.value:
        raise HTTPException(status_code=403, detail="Only employers can update this profile.")
    
    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id.")
    employer_profile = get_employer_by_user_ref_id(session, current_user.id)
    if not employer_profile:
        raise HTTPException(status_code=404, detail="Employer profile not found.")
    
    # Get associated user for username and email
    user = session.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
         raise HTTPException(status_code=404, detail="User account not found.")

    try:
        updated_profile = update_employer_profile(
            session,
            employer_profile,
            employer_data,
            performed_by=current_user.id,
        )
        
        response_data = EmployerResponse(
            id=updated_profile.id,
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            company_name=updated_profile.company_name,
            contact_person_first_name=updated_profile.contact_person_first_name,
            contact_person_last_name=updated_profile.contact_person_last_name,
            contact_person_position=updated_profile.contact_person_position,
            company_website=updated_profile.company_website,
            company_address=updated_profile.company_address,
            company_contact_number=updated_profile.company_contact_number,
            company_logo_url=updated_profile.company_logo_url,
            company_logo_public_id=updated_profile.company_logo_public_id
        )

        return StandardResponse(
            success=True,
            code=SuccessCode.USER_UPDATED.value if hasattr(SuccessCode, 'USER_UPDATED') else 200,
            message="Employer profile updated successfully",
            data=response_data
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/applications", response_model=StandardResponse)
def get_my_applications_route(
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get all job applications for all jobs posted by the current employer.
    """
    if current_user.user_type != UserType.EMPLOYER.value:
        raise HTTPException(status_code=403, detail="Only employers can access this.")
    
    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id.")
    employer = get_employer_by_user_ref_id(db, current_user.id)
    if not employer:
        raise HTTPException(status_code=404, detail="Employer profile not found.")
    
    applications = get_employer_applications(db, employer.id)
    
    # Enrich with alumni and job details
    result = []
    for app in applications:
        # Join with Alumni and User tables
        query = select(Alumni, User).join(User, Alumni.user_ref_id == User.id).where(Alumni.id == app.alumni_ref_id)
        alumni_data = db.exec(query).first()
        job = get_job_listing(db, app.job_listing_ref_id)
        
        if alumni_data and job:
            alumni, user = alumni_data
            # We'll use the employability probability as matchScore for now if available, 
            match_score = 0
            
            # Try to get the latest prediction for this alumni
            from services.queries.predict_queries import get_predictions_by_alumni_ref_id
            predictions = get_predictions_by_alumni_ref_id(db, alumni.id, limit=1)
            if predictions:
                match_score = int(predictions[0].realistic_probability)
            else:
                match_score = 85 if app.status == "Accepted" else 70 if app.status == "Reviewed" else 50

            result.append({
                "id": app.id,
                "applicant": f"{alumni.first_name} {alumni.last_name}",
                "job": job.title,
                "status": app.status,
                "date": app.applied_at.strftime("%b %d, %Y"),
                "email": user.email, # Use the real email from User table
                "matchScore": match_score
            })

    return StandardResponse(
        success=True,
        code=SuccessCode.EMPLOYER_APPLICATIONS_RETRIEVED.value if hasattr(SuccessCode, 'EMPLOYER_APPLICATIONS_RETRIEVED') else 200,
        message="Applications retrieved successfully",
        data=result
    )


@router.patch("/applications/{application_ref_id}/status", response_model=StandardResponse)
def update_application_status_route(
    application_ref_id: str,
    status: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update the status of a job application for an employer's job listing.
    Status can be 'Pending', 'Reviewed', 'Accepted', 'Rejected'.
    """
    if current_user.user_type != UserType.EMPLOYER.value:
        raise HTTPException(status_code=403, detail="Only employers can perform this action.")
    
    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id.")
    employer = get_employer_by_user_ref_id(db, current_user.id)
    if not employer:
        raise HTTPException(status_code=404, detail="Employer profile not found.")

    application = get_job_application_by_ref_id(db, application_ref_id)
    if not application:
        raise HTTPException(status_code=404, detail="Job application not found.")
        
    # Verify the application belongs to a job posted by the employer
    job = get_job_listing(db, application.job_listing_ref_id)
    if not job or job.employer_ref_id != employer.id:
         raise HTTPException(status_code=403, detail="Not authorized to update this application.")
         
    valid_statuses = ["Pending", "Reviewed", "Accepted", "Rejected"]
    if status not in valid_statuses:
         raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
         
    updated_app = update_job_application_status(
        db,
        application_ref_id,
        status,
        performed_by=current_user.id,
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.JOB_UPDATED.value,
        message=f"Application status updated to {status}",
        data={"application_ref_id": updated_app.id, "status": updated_app.status}
    )
