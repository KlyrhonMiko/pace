import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("SUPABASE_URL", "https://supabase.test")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("CLOUDINARY_URL", "cloudinary://test:test@test")
os.environ["REDIS_URL"] = "redis://127.0.0.1:1/0?socket_connect_timeout=0.1&socket_timeout=0.1"

TEST_DATABASE_URL = (
    os.getenv("TEST_DATABASE_URL")
    or os.getenv("PACE_TEST_DATABASE_URL")
)
ALLOW_SHARED_DB = os.getenv("PACE_TEST_ALLOW_SHARED_DB", "").lower() == "true"
DEFAULT_SQLITE_TEST_DB = f"sqlite:///{(BACKEND_ROOT / 'test.db').as_posix()}"

if not TEST_DATABASE_URL and ALLOW_SHARED_DB:
    TEST_DATABASE_URL = os.getenv("DATABASE_URL")

if not TEST_DATABASE_URL and (BACKEND_ROOT / "test.db").exists():
    TEST_DATABASE_URL = DEFAULT_SQLITE_TEST_DB


from main import app  # noqa: E402
from core.database import get_session  # noqa: E402
from models import (  # noqa: E402
    Alumni,
    CollegeDept,
    Employer,
    Staff,
    StudentRecord,
    User,
)
from models.auth import CurrentUser  # noqa: E402
from models.users import UserType  # noqa: E402
from utils.auth import get_current_user  # noqa: E402
from utils.crypto import hash_password  # noqa: E402


@dataclass(frozen=True)
class SeedAccount:
    role: str
    user_id: str
    username: str
    email: str
    password: str
    user_type: str
    internal_id: Any
    profile_public_id: str | None = None

    def current_user(self) -> CurrentUser:
        return CurrentUser(
            id=self.internal_id,
            user_id=self.user_id,
            user_type=self.user_type,
        )


def _require_test_database_url() -> str:
    if not TEST_DATABASE_URL:
        pytest.skip(
            "API tests require TEST_DATABASE_URL or PACE_TEST_DATABASE_URL. "
            "Set PACE_TEST_ALLOW_SHARED_DB=true to opt into DATABASE_URL explicitly."
        )
    return TEST_DATABASE_URL


def _truncate_all_tables(engine) -> None:
    dialect = engine.dialect.name
    if dialect == "sqlite":
        SQLModel.metadata.drop_all(engine)
        SQLModel.metadata.create_all(engine)
        return

    table_names = [table.name for table in SQLModel.metadata.sorted_tables]
    if not table_names:
        return

    joined = ", ".join(table_names)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {joined} RESTART IDENTITY CASCADE"))


def _seed_user(
    session: Session,
    *,
    user_id: str,
    username: str,
    email: str,
    password: str,
    user_type: UserType,
    created_by=None,
) -> User:
    user = User(
        user_id=user_id,
        username=username,
        email=email,
        password=hash_password(password),
        user_type=user_type,
        created_by=created_by,
    )
    session.add(user)
    session.flush()
    if user.created_by is None:
        user.created_by = user.id
        session.add(user)
        session.flush()
    return user


@pytest.fixture(scope="session")
def test_engine():
    database_url = _require_test_database_url()
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)
    SQLModel.metadata.create_all(engine)
    yield engine


@pytest.fixture(scope="session")
def session_factory(test_engine):
    def _factory() -> Session:
        return Session(test_engine)

    return _factory


@pytest.fixture(autouse=True)
def reset_database(test_engine):
    _truncate_all_tables(test_engine)
    yield
    _truncate_all_tables(test_engine)


@pytest.fixture
def db_session(session_factory):
    with session_factory() as session:
        yield session


@pytest.fixture
def app_with_test_db(session_factory):
    def override_get_session():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def client(app_with_test_db):
    with TestClient(app_with_test_db) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    otp_store: dict[str, str] = {}
    otp_attempts: dict[str, int] = {}
    otp_sends: dict[str, int] = {}
    send_limit = 3

    def generate_otp() -> str:
        return "123456"

    def store_otp(email: str, otp_code: str) -> bool:
        otp_store[email.lower()] = otp_code
        otp_attempts[email.lower()] = 0
        return True

    def verify_otp(email: str, otp_code: str):
        key = email.lower()
        saved = otp_store.get(key)
        if saved is None:
            return False, "expired"
        if otp_attempts.get(key, 0) >= 5:
            return False, "max_attempts"
        if saved != otp_code:
            otp_attempts[key] = otp_attempts.get(key, 0) + 1
            return False, "invalid"
        otp_store.pop(key, None)
        otp_attempts.pop(key, None)
        return True, "verified"

    def is_rate_limited(email: str) -> bool:
        return otp_sends.get(email.lower(), 0) >= send_limit

    def increment_send_count(email: str) -> bool:
        key = email.lower()
        otp_sends[key] = otp_sends.get(key, 0) + 1
        return True

    monkeypatch.setattr("routers.otp.generate_otp", generate_otp)
    monkeypatch.setattr("routers.otp.store_otp", store_otp)
    monkeypatch.setattr("routers.otp.verify_otp", verify_otp)
    monkeypatch.setattr("routers.otp.is_rate_limited", is_rate_limited)
    monkeypatch.setattr("routers.otp.increment_otp_send_count", increment_send_count)
    monkeypatch.setattr("routers.otp.send_otp_email", lambda *args, **kwargs: True)
    monkeypatch.setattr("routers.auth.verify_otp", verify_otp)

    async def fake_fetch_jobs(**kwargs):
        return {
            "jobs": [],
            "total": 0,
            "page": kwargs.get("page", 1),
            "limit": kwargs.get("results_per_page", 10),
        }

    monkeypatch.setattr("routers.jobs.fetch_jobs", fake_fetch_jobs)
    monkeypatch.setattr(
        "routers.jobs.get_recommended_jobs",
        lambda session, limit=3: [],
    )

    monkeypatch.setattr(
        "routers.employers.cloudinary.uploader.upload",
        lambda *args, **kwargs: {
            "secure_url": "https://example.test/logo.png",
            "public_id": "company/logo",
        },
    )
    monkeypatch.setattr(
        "routers.employers.cloudinary.uploader.destroy",
        lambda *args, **kwargs: {"result": "ok"},
    )

    async def upload_image(file, event_id):
        return True, f"events/{event_id}/banner.png", None

    async def delete_image(image_path):
        return True, None

    monkeypatch.setattr("routers.events.storage_service.upload_image", upload_image)
    monkeypatch.setattr("routers.events.storage_service.delete_image", delete_image)
    monkeypatch.setattr(
        "routers.events.storage_service.get_public_url",
        lambda image_path: f"https://example.test/{image_path}",
    )

    yield


@pytest.fixture
def seeded_accounts(db_session: Session):
    admin = _seed_user(
        db_session,
        user_id="ADMN-000001",
        username="admin_user",
        email="admin@example.com",
        password="AdminPass123",
        user_type=UserType.ADMIN,
    )
    staff = _seed_user(
        db_session,
        user_id="STAFF-000001",
        username="staff_user",
        email="staff@example.com",
        password="StaffPass123",
        user_type=UserType.STAFF,
        created_by=admin.id,
    )
    faculty = _seed_user(
        db_session,
        user_id="FACULTY-000001",
        username="faculty_user",
        email="faculty@example.com",
        password="FacultyPass123",
        user_type=UserType.FACULTY,
        created_by=admin.id,
    )
    alumni_user = _seed_user(
        db_session,
        user_id="USER-000001",
        username="alumni_user",
        email="alumni@example.com",
        password="AlumniPass123",
        user_type=UserType.USER,
        created_by=admin.id,
    )
    employer_user = _seed_user(
        db_session,
        user_id="EMPLOYER-000001",
        username="employer_user",
        email="employer@example.com",
        password="EmployerPass123",
        user_type=UserType.EMPLOYER,
        created_by=admin.id,
    )

    admin_staff = Staff(
        staff_id="ADMN-000001",
        last_name="Admin",
        first_name="System",
        gender="OTHER",
        user_ref_id=admin.id,
        created_by=admin.id,
    )
    staff_profile = Staff(
        staff_id="STAFF-000001",
        last_name="Member",
        first_name="Staff",
        gender="OTHER",
        user_ref_id=staff.id,
        created_by=admin.id,
    )
    alumni_profile = Alumni(
        alumni_id="ALMN-000001",
        last_name="Alumni",
        first_name="Demo",
        gender="OTHER",
        age=25,
        user_ref_id=alumni_user.id,
        created_by=admin.id,
    )
    employer_profile = Employer(
        company_name="Test Company",
        contact_person_first_name="Emp",
        contact_person_last_name="Loyer",
        contact_person_position="HR",
        company_website="https://example.test",
        company_address="Pasig City",
        company_contact_number="09123456789",
        user_ref_id=employer_user.id,
        created_by=admin.id,
    )

    db_session.add(admin_staff)
    db_session.add(staff_profile)
    db_session.add(alumni_profile)
    db_session.add(employer_profile)
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(staff)
    db_session.refresh(faculty)
    db_session.refresh(alumni_user)
    db_session.refresh(employer_user)
    db_session.refresh(alumni_profile)

    return {
        "admin": SeedAccount(
            role="admin",
            user_id=admin.user_id,
            username=admin.username,
            email=admin.email,
            password="AdminPass123",
            user_type=admin.user_type.value,
            internal_id=admin.id,
            profile_public_id=admin_staff.staff_id,
        ),
        "staff": SeedAccount(
            role="staff",
            user_id=staff.user_id,
            username=staff.username,
            email=staff.email,
            password="StaffPass123",
            user_type=staff.user_type.value,
            internal_id=staff.id,
            profile_public_id=staff_profile.staff_id,
        ),
        "faculty": SeedAccount(
            role="faculty",
            user_id=faculty.user_id,
            username=faculty.username,
            email=faculty.email,
            password="FacultyPass123",
            user_type=faculty.user_type.value,
            internal_id=faculty.id,
        ),
        "alumni": SeedAccount(
            role="alumni",
            user_id=alumni_user.user_id,
            username=alumni_user.username,
            email=alumni_user.email,
            password="AlumniPass123",
            user_type=alumni_user.user_type.value,
            internal_id=alumni_user.id,
            profile_public_id=alumni_profile.alumni_id,
        ),
        "employer": SeedAccount(
            role="employer",
            user_id=employer_user.user_id,
            username=employer_user.username,
            email=employer_user.email,
            password="EmployerPass123",
            user_type=employer_user.user_type.value,
            internal_id=employer_user.id,
        ),
    }


@pytest.fixture
def auth_headers(client: TestClient, seeded_accounts):
    cache: dict[str, dict[str, str]] = {}

    def _headers(role: str) -> dict[str, str]:
        if role in cache:
            return cache[role]
        account = seeded_accounts[role]
        response = client.post(
            "/auth/login",
            json={
                "username": account.username,
                "password": account.password,
            },
        )
        assert response.status_code == 200, response.text
        token = response.json()["data"]["access_token"]
        cache[role] = {"Authorization": f"Bearer {token}"}
        return cache[role]

    return _headers


@pytest.fixture
def make_current_user_override(app_with_test_db):
    def _override(account: SeedAccount):
        async def _current_user():
            return account.current_user()

        app_with_test_db.dependency_overrides[get_current_user] = _current_user

    return _override
