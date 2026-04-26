from sqlmodel import select

from models.alumni import Alumni
from models.response_codes import ErrorCode
from models.staff import Staff
from models.student_records import StudentRecord
from models.users import User
from tests.api_helpers import create_college_dept, create_course, register_alumni, register_employer
from tests.helpers import assert_standard_response, extract_data
from utils.crypto import verify_password


def test_users_single_batch_and_staff_registration(client, auth_headers, db_session):
    admin_headers = auth_headers("admin")
    dept = create_college_dept(client, admin_headers, abbv="EDU", name="College of Education")

    create_user = client.post(
        "/users",
        headers=admin_headers,
        json={
            "username": "created_user",
            "email": "created.user@example.com",
            "password": "CreatedPass123",
            "user_type": "USER",
        },
    )
    assert create_user.status_code == 200
    created_user = extract_data(assert_standard_response(create_user.json(), success=True))
    user_id = created_user["user_id"]

    get_user = client.get(f"/users/{user_id}", headers=admin_headers)
    assert get_user.status_code == 200
    assert extract_data(assert_standard_response(get_user.json(), success=True))["user_id"] == user_id

    list_users = client.get("/users?limit=20&offset=0", headers=admin_headers)
    assert list_users.status_code == 200
    list_payload = assert_standard_response(list_users.json(), success=True)
    assert list_payload["data"]["pagination"]["total"] >= 1

    updated = client.patch(
        f"/users/{user_id}",
        headers=admin_headers,
        json={"email": "updated.user@example.com"},
    )
    assert updated.status_code == 200
    assert extract_data(assert_standard_response(updated.json(), success=True))["email"] == "updated.user@example.com"

    batch_create = client.post(
        "/users/batch",
        headers=admin_headers,
        json={
            "items": [
                {
                    "username": "batch_user_one",
                    "email": "batch.user.one@example.com",
                    "password": "BatchPass123",
                    "user_type": "USER",
                }
            ]
        },
    )
    assert batch_create.status_code == 200
    batch_create_payload = assert_standard_response(batch_create.json(), success=True)
    batch_user_id = batch_create_payload["data"]["results"][0]["data"]["user_id"]

    batch_update = client.patch(
        "/users/batch",
        headers=admin_headers,
        json={"items": [{"user_id": batch_user_id, "username": "batch_user_renamed"}]},
    )
    assert batch_update.status_code == 200
    assert_standard_response(batch_update.json(), success=True)

    batch_delete = client.request(
        "DELETE",
        "/users/batch",
        headers=admin_headers,
        json={"ids": [batch_user_id]},
    )
    assert batch_delete.status_code == 200
    assert_standard_response(batch_delete.json(), success=True)

    batch_restore = client.post(
        "/users/batch/restore",
        headers=admin_headers,
        json={"ids": [batch_user_id]},
    )
    assert batch_restore.status_code == 200
    assert_standard_response(batch_restore.json(), success=True)

    staff_register = client.post(
        "/staff/register",
        headers=admin_headers,
        json={
            "username": "staff_reg",
            "email": "staff.reg@example.com",
            "password": "StaffPass123",
            "user_type": "STAFF",
            "last_name": "Reg",
            "first_name": "Staff",
            "middle_name": "T",
            "gender": "OTHER",
            "college_dept_id": dept["college_dept_id"],
        },
    )
    assert staff_register.status_code == 200
    staff_payload = extract_data(assert_standard_response(staff_register.json(), success=True))
    staff_row = db_session.exec(select(Staff).where(Staff.staff_id == staff_payload["staff_id"])).first()
    assert staff_row is not None
    assert staff_row.college_dept_ref_id is not None

    employer_register = register_employer(
        client,
        username="employer_reg",
        email="employer.reg@example.com",
        password="EmployerPass123",
        company_name="Employer Registration Inc",
    )
    assert employer_register["username"] == "employer_reg"
    employer_user = db_session.exec(select(User).where(User.username == "employer_reg")).first()
    assert employer_user is not None
    assert employer_user.password != "EmployerPass123"
    assert verify_password("EmployerPass123", employer_user.password) is True

    employer_login = client.post(
        "/auth/login",
        json={"username": "employer_reg", "password": "EmployerPass123"},
    )
    assert employer_login.status_code == 200
    assert_standard_response(employer_login.json(), success=True)


def test_user_deactivate_and_restore_cascades_to_alumni_and_student_record(client, auth_headers, db_session):
    admin_headers = auth_headers("admin")
    dept = create_college_dept(client, admin_headers)
    create_course(client, admin_headers, college_dept_abbv=dept["college_dept_abbv"])

    alumni_registration = register_alumni(
        client,
        username="cascade_alumni",
        email="cascade.alumni@example.com",
    )
    alumni_id = alumni_registration["alumni_id"]
    user_id = alumni_registration["user_id"]
    alumni_login = client.post(
        "/auth/login",
        json={"username": "cascade_alumni", "password": "AlumniPass123"},
    )
    assert alumni_login.status_code == 200
    alumni_headers = {"Authorization": f"Bearer {alumni_login.json()['data']['access_token']}"}

    create_student = client.post(
        "/student-records",
        headers=admin_headers,
        json={
            "student_id": "202400001",
            "year_graduated": 2024,
            "gwa": 1.75,
            "avg_prof_grade": 1.7,
            "avg_elec_grade": 1.8,
            "ojt_grade": 1.5,
            "leadership_pos": True,
            "act_member_pos": True,
            "course_abbv": "BSIT",
            "alumni_id": alumni_id,
        },
    )
    assert create_student.status_code == 200
    assert_standard_response(create_student.json(), success=True)

    deactivate = client.post(f"/users/{user_id}/deactivate", headers=admin_headers)
    assert deactivate.status_code == 200
    assert_standard_response(deactivate.json(), success=True)

    deactivated_me = client.get("/auth/me", headers=alumni_headers)
    assert deactivated_me.status_code == 401
    assert_standard_response(deactivated_me.json(), success=False, code=ErrorCode.ACCOUNT_DEACTIVATED.value)

    deactivated_login = client.post(
        "/auth/login",
        json={"username": "cascade_alumni", "password": "AlumniPass123"},
    )
    assert deactivated_login.status_code == 401
    assert_standard_response(deactivated_login.json(), success=False, code=ErrorCode.ACCOUNT_DEACTIVATED.value)

    deactivated_oauth = client.post(
        "/auth/token",
        data={"username": "cascade_alumni", "password": "AlumniPass123"},
    )
    assert deactivated_oauth.status_code == 401
    assert_standard_response(deactivated_oauth.json(), success=False, code=ErrorCode.ACCOUNT_DEACTIVATED.value)

    db_session.expire_all()
    user_row = db_session.exec(select(User).where(User.user_id == user_id)).first()
    alumni_row = db_session.exec(select(Alumni).where(Alumni.alumni_id == alumni_id)).first()
    student_row = db_session.exec(select(StudentRecord).where(StudentRecord.alumni_ref_id == alumni_row.id)).first() if alumni_row else None
    assert user_row is not None and user_row.is_deleted is True
    assert alumni_row is not None and alumni_row.is_deleted is True
    assert student_row is not None and student_row.is_deleted is True

    restore = client.post(f"/users/{user_id}/restore", headers=admin_headers)
    assert restore.status_code == 200
    assert_standard_response(restore.json(), success=True)

    db_session.expire_all()
    user_row = db_session.exec(select(User).where(User.user_id == user_id)).first()
    alumni_row = db_session.exec(select(Alumni).where(Alumni.alumni_id == alumni_id)).first()
    student_row = db_session.exec(select(StudentRecord).where(StudentRecord.alumni_ref_id == alumni_row.id)).first() if alumni_row else None
    assert user_row is not None and user_row.is_deleted is False
    assert alumni_row is not None and alumni_row.is_deleted is False
    assert student_row is not None and student_row.is_deleted is False
