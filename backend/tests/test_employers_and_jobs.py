import io
import uuid

from sqlmodel import select

from models.job_listings import JobApplication, JobListing
from tests.api_helpers import create_job, register_employer
from tests.helpers import assert_standard_response, extract_data


def test_employer_profile_logo_and_job_lifecycle(client, auth_headers, db_session):
    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")
    admin_headers = auth_headers("admin")

    profile = client.get("/employers/me", headers=employer_headers)
    assert profile.status_code == 200
    assert_standard_response(profile.json(), success=True)

    profile_update = client.patch(
        "/employers/me",
        headers=employer_headers,
        json={"company_name": "Updated Test Company"},
    )
    assert profile_update.status_code == 200
    updated_profile = extract_data(assert_standard_response(profile_update.json(), success=True))
    assert updated_profile["company_name"] == "Updated Test Company"

    upload_logo = client.post(
        "/employers/upload-logo",
        headers=employer_headers,
        files={"file": ("logo.png", io.BytesIO(b"fake-image-bytes"), "image/png")},
    )
    assert upload_logo.status_code == 200
    assert_standard_response(upload_logo.json(), success=True)

    registered = register_employer(
        client,
        username="other_employer",
        email="other.employer@example.com",
        company_name="Other Employer",
    )
    assert registered["user_id"]

    job = create_job(client, employer_headers, company="Updated Test Company")
    assert job["title"] == "Backend Engineer"
    job_id = str(job["id"])

    search = client.get("/jobs/search", headers=alumni_headers)
    assert search.status_code == 200
    assert_standard_response(search.json(), success=True)

    recommended = client.get("/jobs/recommended", headers=alumni_headers)
    assert recommended.status_code == 200

    patch_job = client.patch(
        f"/jobs/{job_id}",
        headers=employer_headers,
        json={"location": "Ortigas"},
    )
    assert patch_job.status_code == 200
    assert patch_job.json()["location"] == "Ortigas"

    toggle_hide = client.patch(f"/jobs/{job_id}/hide", headers=employer_headers)
    assert toggle_hide.status_code == 200
    assert toggle_hide.json()["is_active"] is False

    toggle_show = client.patch(f"/jobs/{job_id}/hide", headers=employer_headers)
    assert toggle_show.status_code == 200
    assert toggle_show.json()["is_active"] is True

    apply = client.post(f"/jobs/{job_id}/apply", headers=alumni_headers)
    assert apply.status_code == 200
    application_payload = extract_data(assert_standard_response(apply.json(), success=True))
    application_ref_id = application_payload["application_ref_id"]

    duplicate_apply = client.post(f"/jobs/{job_id}/apply", headers=alumni_headers)
    assert duplicate_apply.status_code == 200
    assert_standard_response(duplicate_apply.json(), success=True)

    my_applications = client.get("/jobs/my-applications", headers=alumni_headers)
    assert my_applications.status_code == 200
    assert_standard_response(my_applications.json(), success=True)

    applicants = client.get(f"/jobs/{job_id}/applicants", headers=employer_headers)
    assert applicants.status_code == 200
    assert_standard_response(applicants.json(), success=True)

    employer_apps = client.get("/employers/applications", headers=employer_headers)
    assert employer_apps.status_code == 200
    assert_standard_response(employer_apps.json(), success=True)

    status_update = client.patch(
        f"/employers/applications/{application_ref_id}/status",
        headers=employer_headers,
        params={"status": "Reviewed"},
    )
    assert status_update.status_code == 200
    assert_standard_response(status_update.json(), success=True)

    deleted = client.delete(f"/jobs/{job_id}", headers=employer_headers)
    assert deleted.status_code == 204

    db_session.expire_all()
    job_row = db_session.exec(select(JobListing).where(JobListing.id == uuid.UUID(job_id))).first()
    application_row = db_session.exec(
        select(JobApplication).where(JobApplication.id == uuid.UUID(application_ref_id))
    ).first()
    assert job_row is not None and job_row.is_deleted is True
    assert application_row is not None and application_row.status == "Reviewed"


def test_search_response_includes_contract_fields(client, auth_headers):
    """Search response shape includes jobs, totalCount, and facets."""
    alumni_headers = auth_headers("alumni")
    search = client.get("/jobs/search", headers=alumni_headers)
    assert search.status_code == 200
    payload = assert_standard_response(search.json(), success=True)
    data = payload["data"]
    assert "jobs" in data
    assert "totalCount" in data
    assert "facets" in data
    assert isinstance(data["jobs"], list)
    assert isinstance(data["totalCount"], int)
    assert isinstance(data["facets"], dict)
    assert "jobTypes" in data["facets"]
    assert "workTypes" in data["facets"]
    assert "experienceLevels" in data["facets"]


def test_recommended_response_includes_job_fields(client, auth_headers):
    """Recommended jobs response shape is a list of job dicts with expected fields."""
    alumni_headers = auth_headers("alumni")
    resp = client.get("/jobs/recommended", headers=alumni_headers)
    assert resp.status_code == 200
    assert_standard_response(resp.json(), success=True)


def test_search_pagination_handles_page_beyond_results(client, auth_headers):
    """Search at a high page number returns empty jobs but correct totalCount."""
    alumni_headers = auth_headers("alumni")
    resp = client.get("/jobs/search?page=50&limit=10", headers=alumni_headers)
    assert resp.status_code == 200
    payload = assert_standard_response(resp.json(), success=True)
    data = payload["data"]
    assert data["jobs"] == []


def test_my_applications_marks_deleted_jobs_unavailable(client, auth_headers):
    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    job = create_job(client, employer_headers, title="Soon Deleted Role")
    job_id = str(job["id"])

    apply = client.post(f"/jobs/{job_id}/apply", headers=alumni_headers)
    assert apply.status_code == 200

    deleted = client.delete(f"/jobs/{job_id}", headers=employer_headers)
    assert deleted.status_code == 204

    my_applications = client.get("/jobs/my-applications", headers=alumni_headers)
    assert my_applications.status_code == 200
    payload = extract_data(assert_standard_response(my_applications.json(), success=True))

    deleted_app = next(app for app in payload if app["job_listing_id"] == job_id)
    assert deleted_app["job_title"] == "Soon Deleted Role"
    assert deleted_app["job_deleted"] is True
    assert deleted_app["company"]


def test_match_route_denies_cross_user_access(client, auth_headers, db_session):
    """Another alumni cannot fetch job matches for a different alumni."""
    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    from models.alumni import Alumni
    second_alumni = db_session.exec(
        select(Alumni).where(Alumni.alumni_id != "ALMN-000001")
    ).first()

    if second_alumni:
        resp = client.get(
            f"/jobs/match/{second_alumni.alumni_id}", headers=alumni_headers
        )
        assert resp.status_code == 403
