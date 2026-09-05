"""
Phase 8.1 authentication foundation tests — user model, password hashing,
roles, login API and configuration.

SQLite-backed (in-memory). No real secrets are used anywhere here.
"""

import pytest

from app import create_app
from app.config import settings
from app.extensions import db
from app.models import User
from app.services import (
    AuthValidationError,
    authenticate_user,
    create_user,
    hash_password,
    verify_password,
)


@pytest.fixture()
def session():
    """Provide a clean database session backed by in-memory SQLite."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        try:
            yield db.session
        finally:
            db.session.remove()
            db.drop_all()


@pytest.fixture()
def api_client():
    """Flask test client bound to a seeded in-memory database."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        create_user(
            db.session,
            email="admin@peoplepay360.com",
            password="Admin@123",
            full_name="Admin User",
            role="ADMIN",
        )
        db.session.commit()
        with app.test_client() as testing_client:
            yield testing_client
        db.session.remove()
        db.drop_all()


# ── User creation ────────────────────────────────────────────────
def test_user_creation(session):
    user = create_user(
        session,
        email="Sara@Example.com",
        password="S3cure!",
        full_name="Sara Khan",
        role="HR_MANAGER",
    )
    session.commit()

    fetched = session.get(User, user.id)
    assert fetched.email == "sara@example.com"
    assert fetched.role == "HR_MANAGER"
    assert fetched.is_active is True
    assert fetched.created_at is not None


def test_duplicate_email_rejected(session):
    create_user(
        session,
        email="dup@example.com",
        password="S3cure!",
        full_name="One",
        role="EMPLOYEE",
    )
    session.commit()
    with pytest.raises(AuthValidationError):
        create_user(
            session,
            email="DUP@example.com",
            password="Other!",
            full_name="Two",
            role="EMPLOYEE",
        )
    session.rollback()


def test_invalid_role_rejected(session):
    with pytest.raises(AuthValidationError):
        create_user(
            session,
            email="x@example.com",
            password="S3cure!",
            full_name="X",
            role="SUPERUSER",
        )
    session.rollback()


def test_role_assignment_all_roles(session):
    from app.models.user import ROLES

    assert set(ROLES) == {
        "ADMIN",
        "HR_MANAGER",
        "HR_PAYROLL_USER",
        "HR_PAYROLL_MANAGER",
        "EMPLOYEE",
    }
    for idx, role in enumerate(ROLES):
        create_user(
            session,
            email=f"user{idx}@example.com",
            password="S3cure!",
            full_name=f"User {idx}",
            role=role,
        )
    session.commit()
    assert session.query(User).count() == 5


# ── Password hashing ─────────────────────────────────────────────
def test_password_is_hashed_not_plaintext(session):
    user = create_user(
        session,
        email="hash@example.com",
        password="S3cure!",
        full_name="Hash",
        role="EMPLOYEE",
    )
    session.commit()
    assert user.password_hash != "S3cure!"
    assert "S3cure!" not in user.password_hash
    assert verify_password(user.password_hash, "S3cure!") is True
    assert verify_password(user.password_hash, "Wrong!") is False


def test_hash_password_requires_value():
    with pytest.raises(AuthValidationError):
        hash_password("  ")


def test_password_never_serialized(session):
    user = create_user(
        session,
        email="ser@example.com",
        password="S3cure!",
        full_name="Ser",
        role="EMPLOYEE",
    )
    session.commit()
    payload = user.to_dict()
    assert "password" not in payload
    assert "password_hash" not in payload
    assert "hash" not in " ".join(payload.keys())


# ── Login API ────────────────────────────────────────────────────
def test_login_success(api_client):
    response = api_client.post(
        "/api/auth/login",
        json={"email": "admin@peoplepay360.com", "password": "Admin@123"},
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["email"] == "admin@peoplepay360.com"
    assert body["user"]["role"] == "ADMIN"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_login_wrong_password(api_client):
    response = api_client.post(
        "/api/auth/login",
        json={"email": "admin@peoplepay360.com", "password": "Nope!"},
    )
    assert response.status_code == 401
    assert response.get_json() == {"detail": "Invalid credentials."}


def test_login_unknown_email(api_client):
    response = api_client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "Whatever1!"},
    )
    assert response.status_code == 401
    # Same generic message — no existence leak.
    assert response.get_json() == {"detail": "Invalid credentials."}


def test_login_missing_credentials(api_client):
    assert api_client.post("/api/auth/login", json={}).status_code == 401
    assert (
        api_client.post(
            "/api/auth/login", json={"email": "a@b.com"}
        ).status_code
        == 401
    )


def test_login_inactive_user(session):
    create_user(
        session,
        email="off@example.com",
        password="S3cure!",
        full_name="Off",
        role="EMPLOYEE",
        is_active=False,
    )
    session.commit()
    assert (
        authenticate_user(session, "off@example.com", "S3cure!") is None
    )


def test_authenticate_user_service(session):
    create_user(
        session,
        email="svc@example.com",
        password="S3cure!",
        full_name="Svc",
        role="HR_MANAGER",
    )
    session.commit()
    user = authenticate_user(session, "svc@example.com", "S3cure!")
    assert user is not None
    assert user.role == "HR_MANAGER"
    assert authenticate_user(session, "svc@example.com", "bad") is None
    assert authenticate_user(session, "missing@example.com", "x") is None


# ── Configuration ────────────────────────────────────────────────
def test_jwt_secret_configuration():
    assert settings.JWT_SECRET_KEY
    assert settings.JWT_ACCESS_TOKEN_EXPIRES_MINUTES > 0
    assert settings.JWT_REFRESH_TOKEN_EXPIRES_DAYS > 0
