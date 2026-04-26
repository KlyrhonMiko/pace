from sqlmodel import select

from models.alumni import Alumni
from models.alumni_skills import AlumniSkills
from models.student_records import StudentRecord
from tests.api_helpers import create_college_dept, create_course, register_alumni
from tests.helpers import assert_standard_response, extract_data


def test_alumni_endpoints_resume_activity_and_batch_flows(client, auth_headers, seeded_accounts, db_session):
    admin_headers = auth_headers("admin")
    alumni_headers = auth_headers("alumni")

    me = client.get("/alumni/me", headers=alumni_headers)
    assert me.status_code == 200
    me_payload = extract_data(assert_standard_response(me.json(), success=True))
    assert me_payload["alumni_id"] == seeded_accounts["alumni"].profile_public_id

    save_resume = client.post(
        "/alumni/resume",
        headers=alumni_headers,
        json={
            "resume_data": {
                "personal": {"headline": "Backend Developer"},
                "education": [{"school": "PACE", "degree": "BSIT"}],
                "experience": [{"company": "PACE", "role": "Intern"}],
                "skills": [{"name": "Python"}],
            }
        },
    )
    assert save_resume.status_code == 200
    assert_standard_response(save_resume.json(), success=True)

    get_resume = client.get("/alumni/resume", headers=alumni_headers)
    assert get_resume.status_code == 200
    resume_payload = extract_data(assert_standard_response(get_resume.json(), success=True))
    assert resume_payload["alumni_id"] == seeded_accounts["alumni"].profile_public_id

    activity = client.get("/alumni/activity/me", headers=alumni_headers)
    assert activity.status_code == 200
    assert_standard_response(activity.json(), success=True)

    batch_register = client.post(
        "/alumni/batch/register",
        headers=admin_headers,
        json={
            "items": [
                {
                    "username": "batch_alumni",
                    "email": "batch.alumni@example.com",
                    "password": "BatchPass123",
                    "last_name": "Batch",
                    "first_name": "Alumni",
                    "middle_name": "T",
                    "gender": "OTHER",
                    "age": 23,
                    "consent_for_survey_ml": True,
                }
            ]
        },
    )
    assert batch_register.status_code == 200
    batch_alumni_id = batch_register.json()["data"]["results"][0]["alumni_id"]

    batch_update = client.patch(
        "/alumni/batch",
        headers=admin_headers,
        json={"items": [{"alumni_id": batch_alumni_id, "employment_status": "Employed"}]},
    )
    assert batch_update.status_code == 200
    assert_standard_response(batch_update.json(), success=True)

    batch_delete = client.request(
        "DELETE",
        "/alumni/batch",
        headers=admin_headers,
        json={"ids": [batch_alumni_id]},
    )
    assert batch_delete.status_code == 200
    assert_standard_response(batch_delete.json(), success=True)

    batch_restore = client.post(
        "/alumni/batch/restore",
        headers=admin_headers,
        json={"ids": [batch_alumni_id]},
    )
    assert batch_restore.status_code == 200
    assert_standard_response(batch_restore.json(), success=True)


def test_student_record_and_alumni_skill_lifecycle(client, auth_headers, db_session):
    admin_headers = auth_headers("admin")
    dept = create_college_dept(client, admin_headers)
    create_course(client, admin_headers, college_dept_abbv=dept["college_dept_abbv"])
    registration = register_alumni(
        client,
        username="student_owner",
        email="student.owner@example.com",
    )
    alumni_id = registration["alumni_id"]
    user_id = registration["user_id"]

    student_create = client.post(
        "/student-records",
        headers=admin_headers,
        json={
            "student_id": "202400010",
            "year_graduated": 2024,
            "gwa": 1.5,
            "avg_prof_grade": 1.6,
            "avg_elec_grade": 1.7,
            "ojt_grade": 1.4,
            "leadership_pos": True,
            "act_member_pos": False,
            "course_abbv": "BSIT",
            "alumni_id": alumni_id,
        },
    )
    assert student_create.status_code == 200
    student_data = extract_data(assert_standard_response(student_create.json(), success=True))
    assert student_data["alumni_id"] == alumni_id

    student_get = client.get(f"/student-records/{alumni_id}", headers=admin_headers)
    assert student_get.status_code == 200
    assert extract_data(assert_standard_response(student_get.json(), success=True))["student_id"] == "202400010"

    student_update = client.patch(
        f"/student-records/{alumni_id}",
        headers=admin_headers,
        json={"gwa": 1.4, "year_graduated": 2024},
    )
    assert student_update.status_code == 200
    assert extract_data(assert_standard_response(student_update.json(), success=True))["gwa"] == 1.4

    alumni_login = client.post(
        "/auth/login",
        json={"username": "student_owner", "password": "AlumniPass123"},
    )
    alumni_headers = {"Authorization": f"Bearer {alumni_login.json()['data']['access_token']}"}

    skills_create = client.post(
        "/alumni-skills",
        headers=alumni_headers,
        json={
            "alumni_id": alumni_id,
            "soft_skills_ave": 88,
            "hard_skills_ave": 91,
            "program_skills": {"Python Programming Skills": 92},
            "program_skills_average": 92,
        },
    )
    assert skills_create.status_code == 200
    assert_standard_response(skills_create.json(), success=True)

    skills_get = client.get(f"/alumni-skills/{alumni_id}", headers=alumni_headers)
    assert skills_get.status_code == 200
    assert_standard_response(skills_get.json(), success=True)

    skills_patch = client.patch(
        f"/alumni-skills/{alumni_id}",
        headers=alumni_headers,
        json={"soft_skills_ave": 90, "program_skills_average": 93},
    )
    assert skills_patch.status_code == 200
    assert_standard_response(skills_patch.json(), success=True)

    student_delete = client.delete(f"/student-records/{alumni_id}", headers=admin_headers)
    assert student_delete.status_code == 200
    assert_standard_response(student_delete.json(), success=True)

    skills_delete = client.delete(f"/alumni-skills/{alumni_id}", headers=alumni_headers)
    assert skills_delete.status_code == 200
    assert_standard_response(skills_delete.json(), success=True)

    db_session.expire_all()
    student_row = db_session.exec(select(StudentRecord).where(StudentRecord.student_id == "202400010")).first()
    skills_row = db_session.exec(select(AlumniSkills).join(Alumni).where(Alumni.alumni_id == alumni_id)).first()
    assert student_row is not None and student_row.is_deleted is True
    assert skills_row is not None and skills_row.is_deleted is True

    student_restore = client.post(f"/student-records/{alumni_id}/restore", headers=admin_headers)
    assert student_restore.status_code == 200
    assert_standard_response(student_restore.json(), success=True)

    skills_recreate = client.post(
        "/alumni-skills",
        headers=alumni_headers,
        json={
            "alumni_id": alumni_id,
            "soft_skills_ave": 91,
            "hard_skills_ave": 93,
            "program_skills": {"Python Programming Skills": 94},
            "program_skills_average": 94,
        },
    )
    assert skills_recreate.status_code == 200
    assert_standard_response(skills_recreate.json(), success=True)

    single_get = client.get(f"/alumni/{alumni_id}", headers=admin_headers)
    assert single_get.status_code == 200
    assert_standard_response(single_get.json(), success=True)

    single_patch = client.patch(
        f"/alumni/{alumni_id}",
        headers=alumni_headers,
        json={"employment_status": "Interviewing"},
    )
    assert single_patch.status_code == 200
    assert extract_data(assert_standard_response(single_patch.json(), success=True))["employment_status"] == "Interviewing"

    alumni_delete = client.delete(f"/alumni/{alumni_id}", headers=admin_headers)
    assert alumni_delete.status_code == 200
    assert_standard_response(alumni_delete.json(), success=True)

    alumni_restore = client.post(f"/alumni/{alumni_id}/restore", headers=admin_headers)
    assert alumni_restore.status_code == 200
    assert_standard_response(alumni_restore.json(), success=True)
