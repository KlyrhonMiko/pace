import json

from sqlmodel import select

from models.college_dept import CollegeDept
from models.event_types import EventType
from models.questions import Question
from tests.api_helpers import create_college_dept, create_course, create_event_type, create_question
from tests.helpers import assert_standard_response, audit_fields_present, extract_data


def test_college_department_single_and_batch_lifecycle(client, auth_headers, db_session):
    admin_headers = auth_headers("admin")

    dept = create_college_dept(client, admin_headers)
    audit_fields_present(dept)
    college_dept_id = dept["college_dept_id"]

    detail = client.get(f"/college-depts/{college_dept_id}", headers=admin_headers)
    assert detail.status_code == 200
    assert extract_data(assert_standard_response(detail.json(), success=True))["college_dept_id"] == college_dept_id

    listing = client.get("/college-depts", headers=admin_headers)
    assert listing.status_code == 200
    list_payload = assert_standard_response(listing.json(), success=True)
    assert list_payload["data"]["pagination"]["total"] >= 1

    patched = client.patch(
        f"/college-depts/{college_dept_id}",
        headers=admin_headers,
        json={"college_dept_desc": "Updated department description"},
    )
    assert patched.status_code == 200
    patched_data = extract_data(assert_standard_response(patched.json(), success=True))
    assert patched_data["college_dept_desc"] == "Updated department description"

    batch_create = client.post(
        "/college-depts/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "college_dept_abbv": "ENG",
                    "college_dept_name": "College of Engineering",
                    "college_dept_desc": "Engineering programs",
                }
            ]
        },
    )
    assert batch_create.status_code == 200
    batch_create_payload = assert_standard_response(batch_create.json(), success=True)
    created_batch_dept_id = batch_create_payload["data"]["results"][0]["data"]["college_dept_id"]

    batch_update = client.patch(
        "/college-depts/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "college_dept_id": created_batch_dept_id,
                    "college_dept_desc": "Updated via batch",
                }
            ]
        },
    )
    assert batch_update.status_code == 200
    assert_standard_response(batch_update.json(), success=True)

    batch_delete = client.request(
        "DELETE",
        "/college-depts/batch",
        headers=admin_headers,
        json={"ids": [created_batch_dept_id]},
    )
    assert batch_delete.status_code == 200
    assert_standard_response(batch_delete.json(), success=True)

    batch_restore = client.post(
        "/college-depts/batch/restore",
        headers=admin_headers,
        json={"ids": [created_batch_dept_id]},
    )
    assert batch_restore.status_code == 200
    assert_standard_response(batch_restore.json(), success=True)

    create_course(client, admin_headers)
    blocked_delete = client.delete(f"/college-depts/{college_dept_id}", headers=admin_headers)
    assert blocked_delete.status_code == 400
    assert_standard_response(blocked_delete.json(), success=False)

    free_dept = create_college_dept(
        client,
        admin_headers,
        abbv="BUS",
        name="College of Business",
    )
    free_dept_id = free_dept["college_dept_id"]
    deleted = client.delete(f"/college-depts/{free_dept_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    db_session.expire_all()
    deleted_row = db_session.exec(select(CollegeDept).where(CollegeDept.college_dept_id == free_dept_id)).first()
    assert deleted_row is not None
    assert deleted_row.is_deleted is True
    assert deleted_row.deleted_by is not None

    restored = client.post(f"/college-depts/{free_dept_id}/restore", headers=admin_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)


def test_event_type_lifecycle(client, auth_headers, db_session):
    admin_headers = auth_headers("admin")
    created = create_event_type(client, admin_headers)
    event_type_id = created["event_type_id"]
    audit_fields_present(created)

    listed = client.get("/event-types/", headers=admin_headers)
    assert listed.status_code == 200
    assert_standard_response(listed.json(), success=True)

    detail = client.get(f"/event-types/{event_type_id}", headers=admin_headers)
    assert detail.status_code == 200
    assert extract_data(assert_standard_response(detail.json(), success=True))["event_type_id"] == event_type_id

    patched = client.patch(
        f"/event-types/{event_type_id}",
        headers=admin_headers,
        json={"event_name": "Updated Career Fair"},
    )
    assert patched.status_code == 200
    assert extract_data(assert_standard_response(patched.json(), success=True))["event_name"] == "Updated Career Fair"

    deleted = client.delete(f"/event-types/{event_type_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    db_session.expire_all()
    row = db_session.exec(select(EventType).where(EventType.event_type_id == event_type_id)).first()
    assert row is not None
    assert row.is_deleted is True

    restored = client.post(f"/event-types/{event_type_id}/restore", headers=admin_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)


def test_question_lifecycle(client, auth_headers, db_session):
    staff_headers = auth_headers("staff")
    question = create_question(
        client,
        staff_headers,
        text="Which roles have you held?",
        question_type="MULTI_SELECT",
        options=json.dumps(["Developer", "Analyst"]),
    )
    question_id = question["question_id"]
    audit_fields_present(question)

    listed = client.get("/questions", headers=staff_headers)
    assert listed.status_code == 200
    list_payload = assert_standard_response(listed.json(), success=True)
    assert list_payload["data"]["count"] >= 1

    detail = client.get(f"/questions/{question_id}", headers=staff_headers)
    assert detail.status_code == 200
    assert extract_data(assert_standard_response(detail.json(), success=True))["question_id"] == question_id

    patched = client.patch(
        f"/questions/{question_id}",
        headers=staff_headers,
        json={"question_text": "Updated question text"},
    )
    assert patched.status_code == 200
    assert extract_data(assert_standard_response(patched.json(), success=True))["question_text"] == "Updated question text"

    deleted = client.delete(f"/questions/{question_id}", headers=staff_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    db_session.expire_all()
    row = db_session.exec(select(Question).where(Question.question_id == question_id)).first()
    assert row is not None
    assert row.is_deleted is True

    restored = client.post(f"/questions/{question_id}/restore", headers=staff_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)
