from tests.api_helpers import create_college_dept, create_course, register_alumni
from tests.helpers import assert_standard_response, extract_data


def test_course_lifecycle_and_batch_endpoints(client, auth_headers):
    admin_headers = auth_headers("admin")
    dept = create_college_dept(client, admin_headers)

    course = create_course(client, admin_headers, college_dept_abbv=dept["college_dept_abbv"])
    course_id = course["course_id"]

    listed = client.get("/courses", headers=admin_headers)
    deleted_list = client.get("/courses/deleted/list", headers=admin_headers)
    all_list = client.get("/courses/all/list", headers=admin_headers)
    for response in [listed, deleted_list, all_list]:
        assert response.status_code == 200
        assert_standard_response(response.json(), success=True)

    detail = client.get(f"/courses/{course_id}", headers=admin_headers)
    assert detail.status_code == 200
    assert extract_data(assert_standard_response(detail.json(), success=True))["course_id"] == course_id

    patched = client.patch(
        f"/courses/{course_id}",
        headers=admin_headers,
        json={"course_desc": "Updated course description"},
    )
    assert patched.status_code == 200
    assert_standard_response(patched.json(), success=True)

    batch_create = client.post(
        "/courses/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "course_abbv": "BSCS",
                    "course_name": "Bachelor of Science in Computer Science",
                    "course_desc": "Computer science program",
                    "college_dept_abbv": dept["college_dept_abbv"],
                }
            ]
        },
    )
    assert batch_create.status_code == 200
    batch_course_id = batch_create.json()["data"]["results"][0]["data"]["course_id"]

    batch_update = client.patch(
        "/courses/batch",
        headers=admin_headers,
        json={"items": [{"course_id": batch_course_id, "course_desc": "Batch updated"}]},
    )
    assert batch_update.status_code == 200
    assert_standard_response(batch_update.json(), success=True)

    batch_delete = client.request(
        "DELETE",
        "/courses/batch",
        headers=admin_headers,
        json={"ids": [batch_course_id]},
    )
    assert batch_delete.status_code == 200
    assert_standard_response(batch_delete.json(), success=True)

    batch_restore = client.post(
        "/courses/batch/restore",
        headers=admin_headers,
        json={"ids": [batch_course_id]},
    )
    assert batch_restore.status_code == 200
    assert_standard_response(batch_restore.json(), success=True)

    deleted = client.delete(f"/courses/{course_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    restored = client.post(f"/courses/{course_id}/restore", headers=admin_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)


def test_student_records_and_alumni_skills_batch_and_list_endpoints(client, auth_headers):
    admin_headers = auth_headers("admin")
    dept = create_college_dept(client, admin_headers)
    create_course(client, admin_headers, college_dept_abbv=dept["college_dept_abbv"])
    registration = register_alumni(
        client,
        username="batch_owner",
        email="batch.owner@example.com",
    )
    alumni_id = registration["alumni_id"]

    batch_student_create = client.post(
        "/student-records/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "student_id": "202400020",
                    "year_graduated": 2024,
                    "gwa": 1.8,
                    "avg_prof_grade": 1.8,
                    "avg_elec_grade": 1.9,
                    "ojt_grade": 1.6,
                    "leadership_pos": True,
                    "act_member_pos": True,
                    "course_abbv": "BSIT",
                    "alumni_id": alumni_id,
                }
            ]
        },
    )
    assert batch_student_create.status_code == 200
    assert_standard_response(batch_student_create.json(), success=True)

    list_records = client.get("/student-records", headers=admin_headers)
    deleted_records = client.get("/student-records/deleted/list", headers=admin_headers)
    all_records = client.get("/student-records/all/list", headers=admin_headers)
    for response in [list_records, deleted_records, all_records]:
        assert response.status_code == 200
        assert_standard_response(response.json(), success=True)

    batch_student_update = client.patch(
        "/student-records/batch",
        headers=admin_headers,
        json={"items": [{"alumni_id": alumni_id, "gwa": 1.6}]},
    )
    assert batch_student_update.status_code == 200
    assert_standard_response(batch_student_update.json(), success=True)

    batch_skills_create = client.post(
        "/alumni-skills/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "alumni_id": alumni_id,
                    "soft_skills_ave": 80,
                    "hard_skills_ave": 85,
                    "program_skills": {"Python Programming Skills": 88},
                    "program_skills_average": 88,
                }
            ]
        },
    )
    assert batch_skills_create.status_code == 200
    assert_standard_response(batch_skills_create.json(), success=True)

    batch_skills_update = client.patch(
        "/alumni-skills/batch",
        headers=admin_headers,
        json={"items": [{"alumni_id": alumni_id, "soft_skills_ave": 82}]},
    )
    assert batch_skills_update.status_code == 200
    assert_standard_response(batch_skills_update.json(), success=True)

    batch_student_delete = client.request(
        "DELETE",
        "/student-records/batch",
        headers=admin_headers,
        json={"ids": [alumni_id]},
    )
    assert batch_student_delete.status_code == 200
    assert_standard_response(batch_student_delete.json(), success=True)

    batch_student_restore = client.post(
        "/student-records/batch/restore",
        headers=admin_headers,
        json={"ids": [alumni_id]},
    )
    assert batch_student_restore.status_code == 200
    assert_standard_response(batch_student_restore.json(), success=True)
