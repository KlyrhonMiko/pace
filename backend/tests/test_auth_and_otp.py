from sqlmodel import select

from models.response_codes import ErrorCode
from models.transaction_logs import TransactionLog
from models.user_activities import UserActivity
from models.users import User
from tests.helpers import assert_standard_response


def test_root_login_me_logout_and_invalid_login(client, auth_headers, seeded_accounts, db_session):
    root = client.get("/")
    assert root.status_code == 200
    assert root.json()["message"] == "Hello from PACE Backend v3"

    bad_login = client.post(
        "/auth/login",
        json={"username": "admin_user", "password": "wrong-password"},
    )
    assert bad_login.status_code == 401
    assert_standard_response(bad_login.json(), success=False)

    bad_oauth = client.post(
        "/auth/token",
        data={"username": "admin_user", "password": "wrong-password"},
    )
    assert bad_oauth.status_code == 401
    assert_standard_response(bad_oauth.json(), success=False)

    headers = auth_headers("admin")
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    me_payload = assert_standard_response(me.json(), success=True)
    assert me_payload["data"]["user_id"] == seeded_accounts["admin"].user_id
    assert me_payload["data"]["user_type"] == "ADMIN"

    oauth_login = client.post(
        "/auth/token",
        data={"username": "admin_user", "password": "AdminPass123"},
    )
    assert oauth_login.status_code == 200
    oauth_payload = oauth_login.json()
    assert oauth_payload["access_token"]
    assert oauth_payload["token_type"] == "bearer"
    oauth_headers = {"Authorization": f"Bearer {oauth_payload['access_token']}"}

    oauth_me = client.get("/auth/me", headers=oauth_headers)
    assert oauth_me.status_code == 200
    assert oauth_me.json()["data"]["user_id"] == seeded_accounts["admin"].user_id

    logout = client.post("/auth/logout", headers=oauth_headers)
    assert logout.status_code == 200
    assert_standard_response(logout.json(), success=True)

    revoked_me = client.get("/auth/me", headers=oauth_headers)
    assert revoked_me.status_code == 401
    assert_standard_response(revoked_me.json(), success=False, code=ErrorCode.TOKEN_REVOKED.value)

    missing_auth = client.get("/users?limit=1&offset=0")
    assert missing_auth.status_code == 401
    assert_standard_response(missing_auth.json(), success=False, code=ErrorCode.UNAUTHORIZED.value)

    forbidden = client.get("/users?limit=1&offset=0", headers=auth_headers("alumni"))
    assert forbidden.status_code == 403
    assert_standard_response(forbidden.json(), success=False, code=ErrorCode.FORBIDDEN.value)

    db_session.expire_all()
    logs = db_session.exec(
        select(TransactionLog).where(TransactionLog.tl_name.in_(["USER LOGGED IN", "USER LOGGED OUT"]))
    ).all()
    assert len(logs) >= 3

    activities = db_session.exec(
        select(UserActivity).where(UserActivity.activity_type.in_(["LOGIN", "LOGOUT"]))
    ).all()
    assert len(activities) >= 3


def test_otp_send_verify_resend_and_reset_password(client, db_session, seeded_accounts):
    send = client.post("/otp/send", json={"email": "reset-target@example.com"})
    assert send.status_code == 200
    assert_standard_response(send.json(), success=True)

    invalid = client.post(
        "/otp/verify",
        json={"email": "reset-target@example.com", "otp_code": "000000"},
    )
    assert invalid.status_code == 200
    assert_standard_response(invalid.json(), success=False)

    resend_one = client.post("/otp/resend", json={"email": "reset-target@example.com"})
    resend_two = client.post("/otp/resend", json={"email": "reset-target@example.com"})
    resend_three = client.post("/otp/resend", json={"email": "reset-target@example.com"})
    assert resend_one.status_code == 200
    assert resend_two.status_code == 200
    assert resend_three.status_code == 200
    assert resend_three.json()["success"] is False

    user = db_session.exec(select(User).where(User.username == "admin_user")).first()
    assert user is not None
    old_login = client.post(
        "/auth/login",
        json={"username": "admin_user", "password": "AdminPass123"},
    )
    assert old_login.status_code == 200
    old_headers = {"Authorization": f"Bearer {old_login.json()['data']['access_token']}"}

    send_for_reset = client.post("/otp/send", json={"email": user.email})
    assert send_for_reset.status_code == 200
    assert send_for_reset.json()["success"] is True

    reset = client.post(
        "/auth/reset-password",
        json={
            "email": user.email,
            "otp_code": "123456",
            "new_password": "NewAdminPass123",
        },
    )
    assert reset.status_code == 200
    assert_standard_response(reset.json(), success=True)

    revoked_old_token = client.get("/auth/me", headers=old_headers)
    assert revoked_old_token.status_code == 401
    assert_standard_response(revoked_old_token.json(), success=False, code=ErrorCode.TOKEN_REVOKED.value)

    weak_send = client.post("/otp/send", json={"email": user.email})
    assert weak_send.status_code == 200
    weak_reset = client.post(
        "/auth/reset-password",
        json={
            "email": user.email,
            "otp_code": "123456",
            "new_password": "weak",
        },
    )
    assert weak_reset.status_code == 400
    assert_standard_response(weak_reset.json(), success=False, code=ErrorCode.INVALID_PASSWORD.value)

    relogin = client.post(
        "/auth/login",
        json={"username": "admin_user", "password": "NewAdminPass123"},
    )
    assert relogin.status_code == 200
    assert_standard_response(relogin.json(), success=True)
