from sqlmodel import Session, select
from models.employers import Employer
from schemas.employers import EmployerUpdate
import uuid
from services.queries.audit import stamp_create, stamp_update
from services.queries.transaction_logs_queries import create_transaction_log
from models.user_activities import ActivityType
from services.queries.user_activities_queries import create_user_activity

def create_employer_profile(
    session: Session,
    user_ref_id: uuid.UUID,
    company_name: str,
    contact_person_first_name: str,
    contact_person_last_name: str,
    contact_person_position: str | None = None,
    company_website: str | None = None,
    company_address: str | None = None,
    company_contact_number: str | None = None,
    performed_by: str | uuid.UUID | None = None,
) -> Employer:
    """Creates a new employer profile bound to a base User."""
    employer = Employer(
        user_ref_id=user_ref_id,
        company_name=company_name,
        contact_person_first_name=contact_person_first_name,
        contact_person_last_name=contact_person_last_name,
        contact_person_position=contact_person_position,
        company_website=company_website,
        company_address=company_address,
        company_contact_number=company_contact_number,
    )
    stamp_create(employer, performed_by)
    session.add(employer)
    create_transaction_log(
        session,
        tl_name=f"CREATED employer profile {company_name}",
        after=employer,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(employer)
    return employer

def get_employer_by_user_ref_id(session: Session, user_ref_id: uuid.UUID) -> Employer | None:
    """Fetch an employer profile by user_ref_id."""
    return session.exec(
        select(Employer).where(
            (Employer.user_ref_id == user_ref_id) & (Employer.is_deleted == False)
        )
    ).first()

def update_employer_profile(
    session: Session,
    employer: Employer,
    data: EmployerUpdate,
    performed_by: str | uuid.UUID | None = None,
) -> Employer:
    """Updates an existing employer profile."""
    before_state = employer.model_dump(mode="json")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employer, key, value)

    stamp_update(employer)
    session.add(employer)
    create_transaction_log(
        session,
        tl_name=f"UPDATED employer profile {employer.company_name}",
        before=before_state,
        after=employer,
        performed_by=performed_by,
    )
    if performed_by is not None:
        create_user_activity(
            session=session,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.UPDATE_COMPANY_PROFILE,
            description="Updated company profile details",
            activity_metadata={
                "employer_ref_id": str(employer.id),
            },
        )
    session.commit()
    session.refresh(employer)
    return employer


def update_employer_logo(
    session: Session,
    employer: Employer,
    logo_url: str,
    public_id: str | None,
    performed_by: str | uuid.UUID | None = None,
) -> Employer:
    before_state = {
        "company_logo_url": employer.company_logo_url,
        "company_logo_public_id": employer.company_logo_public_id,
    }
    employer.company_logo_url = logo_url
    employer.company_logo_public_id = public_id
    stamp_update(employer)
    session.add(employer)
    create_transaction_log(
        session,
        tl_name=f"UPDATED employer logo {employer.company_name}",
        before=before_state,
        after={
            "company_logo_url": employer.company_logo_url,
            "company_logo_public_id": employer.company_logo_public_id,
        },
        performed_by=performed_by,
    )
    if performed_by is not None:
        create_user_activity(
            session=session,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.UPDATE_COMPANY_PROFILE,
            description="Updated company logo",
            activity_metadata={
                "employer_ref_id": str(employer.id),
            },
        )
    session.commit()
    session.refresh(employer)
    return employer
