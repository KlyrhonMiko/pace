from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi.testclient import TestClient

from tests.helpers import assert_standard_response, extract_data


def utc_now_plus(days: int = 0) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def create_college_dept(
    client: TestClient,
    headers: dict[str, str],
    *,
    abbv: str = "CCS",
    name: str = "College of Computer Studies",
    desc: str = "Core technology department",
) -> dict[str, Any]:
    response = client.post(
        "/college-depts",
        headers=headers,
        json={
            "college_dept_abbv": abbv,
            "college_dept_name": name,
            "college_dept_desc": desc,
        },
    )
    assert response.status_code == 200, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_course(
    client: TestClient,
    headers: dict[str, str],
    *,
    course_abbv: str = "BSIT",
    course_name: str = "Bachelor of Science in Information Technology",
    college_dept_abbv: str = "CCS",
) -> dict[str, Any]:
    response = client.post(
        "/courses",
        headers=headers,
        json={
            "course_abbv": course_abbv,
            "course_name": course_name,
            "course_desc": "Technology course",
            "college_dept_abbv": college_dept_abbv,
        },
    )
    assert response.status_code == 200, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_question(
    client: TestClient,
    headers: dict[str, str],
    *,
    text: str = "Are you currently employed?",
    question_type: str = "YES_NO",
    options: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "question_text": text,
        "question_type": question_type,
        "is_required": True,
    }
    if options is not None:
        body["options"] = options
    response = client.post("/questions", headers=headers, json=body)
    assert response.status_code == 201, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_event_type(
    client: TestClient,
    headers: dict[str, str],
    *,
    name: str = "Career Fair",
) -> dict[str, Any]:
    response = client.post(
        "/event-types/",
        headers=headers,
        json={"event_name": name},
    )
    assert response.status_code == 200, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_event(
    client: TestClient,
    headers: dict[str, str],
    *,
    event_type_name: str = "Career Fair",
    name: str = "PACE Career Fair",
) -> dict[str, Any]:
    now = utc_now_plus(14)
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "event_name": name,
            "description": "Employer networking day",
            "event_type_name": event_type_name,
            "date": now.isoformat(),
            "time_start": "09:00:00",
            "time_end": "17:00:00",
            "location": "PACE Hall",
            "capacity": 200,
        },
    )
    assert response.status_code == 201, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_survey(
    client: TestClient,
    headers: dict[str, str],
    *,
    title: str = "Graduate Outcomes Survey",
) -> dict[str, Any]:
    opens_at = utc_now_plus(1)
    closes_at = utc_now_plus(30)
    response = client.post(
        "/surveys",
        headers=headers,
        json={
            "title": title,
            "description": "Survey about graduate outcomes",
            "is_anonymous": False,
            "allow_multiple_responses": False,
            "opens_at": opens_at.isoformat(),
            "closes_at": closes_at.isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def register_alumni(
    client: TestClient,
    *,
    username: str,
    email: str,
    password: str = "AlumniPass123",
    first_name: str = "Case",
    last_name: str = "Alumni",
) -> dict[str, Any]:
    response = client.post(
        "/alumni/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name,
            "middle_name": "T",
            "gender": "OTHER",
            "age": 24,
            "consent_for_survey_ml": True,
        },
    )
    assert response.status_code == 200, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def register_employer(
    client: TestClient,
    *,
    username: str,
    email: str,
    password: str = "EmployerPass123",
    company_name: str = "Integration Co",
) -> dict[str, Any]:
    response = client.post(
        "/employers/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "company_name": company_name,
            "contact_person_first_name": "Casey",
            "contact_person_last_name": "Employer",
            "contact_person_position": "HR",
            "company_website": "https://example.test",
            "company_address": "Ortigas",
            "company_contact_number": "09123456789",
        },
    )
    assert response.status_code == 200, response.text
    payload = assert_standard_response(response.json(), success=True)
    return extract_data(payload)


def create_job(
    client: TestClient,
    headers: dict[str, str],
    *,
    title: str = "Backend Engineer",
    company: str = "PACE Labs",
) -> dict[str, Any]:
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "title": title,
            "company": company,
            "description": "Build backend systems",
            "location": "Pasig",
            "job_type": "Full-time",
            "work_type": "On-site",
            "experience_level": "Entry Level",
            "salary_min": 25000,
            "salary_max": 35000,
            "source_api": "Internal",
            "source_url": "https://example.test/jobs/backend-engineer",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()
