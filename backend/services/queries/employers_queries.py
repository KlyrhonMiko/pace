from sqlmodel import Session, select
from models.employers import Employer
from schemas.employers import EmployerCreate, EmployerUpdate
import uuid

def create_employer_profile(
    session: Session,
    user_code: uuid.UUID,
    company_name: str,
    contact_person_first_name: str,
    contact_person_last_name: str,
    contact_person_position: str | None = None,
    company_website: str | None = None,
    company_address: str | None = None,
) -> Employer:
    """Creates a new employer profile bound to a base User."""
    employer = Employer(
        user_code=user_code,
        company_name=company_name,
        contact_person_first_name=contact_person_first_name,
        contact_person_last_name=contact_person_last_name,
        contact_person_position=contact_person_position,
        company_website=company_website,
        company_address=company_address,
    )
    session.add(employer)
    session.commit()
    session.refresh(employer)
    return employer

def get_employer_by_user_code(session: Session, user_code: uuid.UUID) -> Employer | None:
    """Fetch an employer profile by user_code."""
    return session.exec(
        select(Employer).where(Employer.user_code == user_code)
    ).first()

def update_employer_profile(session: Session, employer: Employer, data: EmployerUpdate) -> Employer:
    """Updates an existing employer profile."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employer, key, value)
    
    session.add(employer)
    session.commit()
    session.refresh(employer)
    return employer

