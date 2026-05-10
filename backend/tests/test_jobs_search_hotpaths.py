import asyncio
import uuid

import pytest
from sqlmodel import select

from models.job_listings import JobListingCreate
from models.job_listings import JobListing
from services.jooble.core import (
    _build_local_jobs_query,
    _compute_facets,
    _filter_external_jobs,
    _fetch_local_jobs_with_logos,
    fetch_jobs,
    get_recommended_jobs,
)
from services.queries.jobs_queries import create_job_listing
from tests.api_helpers import create_job


def test_build_local_jobs_query_excludes_deleted():
    query = _build_local_jobs_query()
    sql = str(query)
    assert "is_deleted" in sql
    assert "False" in sql or "false" in sql.lower()


def test_build_local_jobs_query_inactive_filter():
    query = _build_local_jobs_query(include_inactive=False)
    sql = str(query)
    assert "is_active = true" in sql.lower()

    query = _build_local_jobs_query(include_inactive=True)
    sql = str(query)
    assert "is_active = true" not in sql.lower()


def test_build_local_jobs_query_employer_filter():
    eid = uuid.uuid4()
    query = _build_local_jobs_query(employer_ref_id=eid)
    sql = str(query)
    assert "employer_ref_id" in sql


def test_build_local_jobs_query_local_only():
    query = _build_local_jobs_query(local_only=True)
    sql = str(query)
    assert "source_api" in sql


def test_build_local_jobs_query_keywords():
    query = _build_local_jobs_query(keywords="python")
    compiled = query.compile(compile_kwargs={"literal_binds": True})
    sql = str(compiled).lower()
    assert "python" in sql


def test_build_local_jobs_query_location():
    query = _build_local_jobs_query(location="Cebu")
    compiled = query.compile(compile_kwargs={"literal_binds": True})
    sql = str(compiled).lower()
    assert "cebu" in sql


def test_compute_facets_empty():
    result = _compute_facets([])
    assert result == {"jobTypes": {}, "workTypes": {}, "experienceLevels": {}}


def test_compute_facets_counts_correctly():
    jobs = [
        {"type": "Full-time", "work_type": "On-site", "experience_level": "Mid-Level"},
        {"type": "Full-time", "work_type": "Remote", "experience_level": "Senior"},
        {"type": "Part-time", "work_type": "On-site", "experience_level": "Mid-Level"},
    ]
    facets = _compute_facets(jobs)
    assert facets["jobTypes"]["Full-time"] == 2
    assert facets["jobTypes"]["Part-time"] == 1
    assert facets["workTypes"]["On-site"] == 2
    assert facets["workTypes"]["Remote"] == 1
    assert facets["experienceLevels"]["Mid-Level"] == 2
    assert facets["experienceLevels"]["Senior"] == 1


def test_compute_facets_uses_defaults():
    jobs = [{"type": None, "work_type": None, "experience_level": None}]
    facets = _compute_facets(jobs)
    assert facets["jobTypes"]["Full-time"] == 1
    assert facets["workTypes"]["On-site"] == 1
    assert facets["experienceLevels"]["Not specified"] == 1


def test_filter_external_jobs_by_location():
    jobs = [
        {"location": "Manila, Philippines"},
        {"location": "Cebu, Philippines"},
        {"location": "Singapore"},
    ]
    result = _filter_external_jobs(jobs, location="Cebu")
    assert len(result) == 1
    assert result[0]["location"] == "Cebu, Philippines"

    result_all = _filter_external_jobs(jobs, location="Philippines")
    assert len(result_all) == 3


def test_filter_external_jobs_by_job_type():
    jobs = [
        {"type": "Full-time"},
        {"type": "Part-time", "job_type": "Part-time"},
        {"job_type": "Contract"},
    ]
    result = _filter_external_jobs(jobs, job_type="full-time")
    assert len(result) == 1
    assert result[0]["type"] == "Full-time"

    result2 = _filter_external_jobs(jobs, job_type="contract")
    assert len(result2) == 1
    assert result2[0]["job_type"] == "Contract"


def test_filter_external_jobs_by_work_type():
    jobs = [{"work_type": "Remote"}, {"work_type": "On-site"}, {"work_type": None}]
    result = _filter_external_jobs(jobs, work_type="remote")
    assert len(result) == 1
    assert result[0]["work_type"] == "Remote"


def test_filter_external_jobs_by_experience_level():
    jobs = [
        {"experience_level": "Senior"},
        {"experience_level": "Mid-Level"},
        {"experience_level": "Senior"},
    ]
    result = _filter_external_jobs(jobs, experience_level="senior")
    assert len(result) == 2


def test_filter_external_jobs_no_filters():
    jobs = [{"title": "A"}, {"title": "B"}]
    result = _filter_external_jobs(jobs)
    assert len(result) == 2


def test_fetch_local_jobs_returns_deleted_excluded(client, auth_headers, db_session):
    """Soft-deleted jobs do not appear in local search results."""
    employer_headers = auth_headers("employer")

    job = create_job(client, employer_headers, title="Deleted Job Test")
    job_id = str(job["id"])

    client.delete(f"/jobs/{job_id}", headers=employer_headers)

    db_session.expire_all()
    jobs = _fetch_local_jobs_with_logos(db_session)
    titles = {j.get("title") for j in jobs}
    assert "Deleted Job Test" not in titles


def test_match_response_includes_required_fields(client, auth_headers, db_session, monkeypatch):
    """Match response includes similarity_score, match_percentage, and logo fields."""
    import routers.jobs as jobs_router
    import services.queries.jobs_queries as jobs_queries_module
    import pickle
    import numpy as np

    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    embedding_bytes = pickle.dumps(np.array([0.9, 0.1, 0.2]))
    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: embedding_bytes,
    )

    created_job = create_job(client, employer_headers, title="Data Scientist")

    from models.alumni import Alumni
    alumni = db_session.exec(
        select(Alumni).where(Alumni.alumni_id == "ALMN-000001")
    ).first()
    assert alumni is not None
    alumni.skills = ["Python", "Machine Learning"]
    db_session.add(alumni)
    db_session.commit()

    monkeypatch.setattr(jobs_router.job_matching_service, "load_model", lambda: object())
    monkeypatch.setattr(
        jobs_router.job_matching_service,
        "calculate_similarity",
        lambda profile_text, job_embeddings: [
            {
                "job_id": created_job["id"],
                "title": "Data Scientist",
                "company": created_job["company"],
                "similarity_score": 0.72,
                "match_percentage": 88.0,
            }
        ],
    )

    response = client.get(f"/jobs/match/{alumni.alumni_id}", headers=alumni_headers)
    assert response.status_code == 200

    from tests.helpers import extract_data, assert_standard_response
    payload = extract_data(assert_standard_response(response.json(), success=True))
    assert len(payload) == 1
    assert payload[0]["title"] == "Data Scientist"
    assert "similarity_score" in payload[0]
    assert "match_percentage" in payload[0]
    assert "logo" in payload[0]
    assert payload[0]["similarity_score"] == 0.72
    assert payload[0]["match_percentage"] == 88.0


def test_get_recommended_jobs_respects_limit(db_session, monkeypatch):
    import services.queries.jobs_queries as jobs_queries_module

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )

    for idx in range(5):
        create_job_listing(
            db_session,
            JobListingCreate(
                title=f"Recommended {idx}",
                company="PACE Labs",
                description="Role",
                location="Pasig",
                job_type="Full-time",
                work_type="On-site",
                experience_level="Entry Level",
                salary_min=20000 + idx,
                salary_max=30000 + idx,
                source_api="Internal",
                source_url=f"https://example.test/jobs/recommended-{idx}",
            ),
        )

    result = asyncio.run(get_recommended_jobs(db_session, limit=2))
    assert len(result) == 2


def test_fetch_jobs_local_salary_and_has_salary_filters(db_session, monkeypatch):
    import services.queries.jobs_queries as jobs_queries_module

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )

    create_job_listing(
        db_session,
        JobListingCreate(
            title="Low Salary",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            salary_min=15000,
            salary_max=20000,
            source_api="Internal",
            source_url="https://example.test/jobs/low-salary",
        ),
    )
    create_job_listing(
        db_session,
        JobListingCreate(
            title="High Salary",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            salary_min=50000,
            salary_max=65000,
            source_api="Internal",
            source_url="https://example.test/jobs/high-salary",
        ),
    )
    create_job_listing(
        db_session,
        JobListingCreate(
            title="No Salary",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            source_api="Internal",
            source_url="https://example.test/jobs/no-salary",
        ),
    )

    salary_result = asyncio.run(
        fetch_jobs(
            session=db_session,
            local_only=True,
            salary=30000,
        )
    )
    salary_titles = {job["title"] for job in salary_result["jobs"]}
    assert "High Salary" in salary_titles
    assert "Low Salary" not in salary_titles

    has_salary_result = asyncio.run(
        fetch_jobs(
            session=db_session,
            local_only=True,
            has_salary=True,
        )
    )
    has_salary_titles = {job["title"] for job in has_salary_result["jobs"]}
    assert "No Salary" not in has_salary_titles
    assert "High Salary" in has_salary_titles
    assert "Low Salary" in has_salary_titles


def test_fetch_jobs_deduplicates_local_external_ids(db_session, monkeypatch):
    import services.jooble.core as jooble_core
    import services.queries.jobs_queries as jobs_queries_module

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )
    monkeypatch.setattr(jooble_core.settings, "JOOBLE_API_KEY", "test-key")
    monkeypatch.setattr(
        jooble_core,
        "_fetch_and_normalize_remote",
        lambda api_keywords, search_location, salary, has_salary: asyncio.sleep(0, result=[
            {"id": "external-1", "title": "Remote Duplicate", "company": "Remote Co", "location": "Pasig", "salary": "₱30,000", "type": "Full-time", "work_type": "On-site", "experience_level": "Entry Level"},
            {"id": "external-2", "title": "Remote Unique", "company": "Remote Co", "location": "Pasig", "salary": "₱30,000", "type": "Full-time", "work_type": "On-site", "experience_level": "Entry Level"},
        ]),
    )

    create_job_listing(
        db_session,
        JobListingCreate(
            title="Local Duplicate",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            salary_min=25000,
            salary_max=35000,
            source_api="Internal",
            source_url="https://example.test/jobs/local-duplicate",
            external_id="external-1",
        ),
    )

    result = asyncio.run(fetch_jobs(session=db_session))
    titles = [job["title"] for job in result["jobs"]]
    assert titles.count("Remote Duplicate") == 0
    assert "Local Duplicate" in titles
    assert "Remote Unique" in titles


def test_fetch_jobs_high_volume_local_only_paginates(db_session, monkeypatch):
    import services.queries.jobs_queries as jobs_queries_module

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )

    for idx in range(60):
        create_job_listing(
            db_session,
            JobListingCreate(
                title=f"Volume Job {idx:02d}",
                company="PACE Labs",
                description="Role",
                location="Pasig",
                job_type="Full-time",
                work_type="On-site",
                experience_level="Entry Level",
                salary_min=25000,
                salary_max=35000,
                source_api="Internal",
                source_url=f"https://example.test/jobs/volume-{idx}",
            ),
        )

    result = asyncio.run(
        fetch_jobs(
            session=db_session,
            local_only=True,
            page=2,
            results_per_page=10,
        )
    )
    assert result["totalCount"] == 60
    assert len(result["jobs"]) == 10


def test_recommended_route_respects_limit_with_real_service(
    client, auth_headers, db_session, monkeypatch
):
    import routers.jobs as jobs_router
    import services.jooble.core as jooble_core
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )
    monkeypatch.setattr(jobs_router, "get_recommended_jobs", jooble_core.get_recommended_jobs)

    for idx in range(5):
        create_job(client, employer_headers, title=f"Route Recommended {idx}")

    response = client.get("/jobs/recommended?limit=2", headers=alumni_headers)
    assert response.status_code == 200

    from tests.helpers import extract_data, assert_standard_response

    payload = extract_data(assert_standard_response(response.json(), success=True))
    assert len(payload) == 2


def test_search_route_local_only_filters_with_real_service(
    client, auth_headers, db_session, monkeypatch
):
    import routers.jobs as jobs_router
    import services.jooble.core as jooble_core
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: None,
    )
    monkeypatch.setattr(jobs_router, "fetch_jobs", jooble_core.fetch_jobs)

    create_job_listing(
        db_session,
        JobListingCreate(
            title="Route Low Salary",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            salary_min=15000,
            salary_max=20000,
            source_api="Internal",
            source_url="https://example.test/jobs/route-low-salary",
        ),
    )
    create_job_listing(
        db_session,
        JobListingCreate(
            title="Route High Salary",
            company="PACE Labs",
            description="Role",
            location="Pasig",
            job_type="Full-time",
            work_type="On-site",
            experience_level="Entry Level",
            salary_min=55000,
            salary_max=70000,
            source_api="Internal",
            source_url="https://example.test/jobs/route-high-salary",
        ),
    )

    response = client.get(
        "/jobs/search?local_only=true&salary=30000&has_salary=true",
        headers=alumni_headers,
    )
    assert response.status_code == 200

    from tests.helpers import extract_data, assert_standard_response

    payload = extract_data(assert_standard_response(response.json(), success=True))
    titles = {job["title"] for job in payload["jobs"]}
    assert "Route High Salary" in titles
    assert "Route Low Salary" not in titles
