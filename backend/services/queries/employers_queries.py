from sqlmodel import Session
from models.employers import Employer
from schemas.employers import EmployerCreate
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
