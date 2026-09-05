"""
Phase 8.5 security hardening tests — headers, secret hygiene, input
robustness and self-protection guards.

SQLite-backed (in-memory).
"""

import pytest

from app import create_app
from app.extensions import db
from app.services import create_user


@pytest.fixture()
def sec_client():
    """Test client with an admin and an employee user."""
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
            full_name="Admin",
            role="ADMIN",
        )
        create_user(
            db.session,
            email="emp@example.com",
            password="S3cure!",
            full_name="Emp",
            role="EMPLOYEE",
        )
        db.session.commit()
        with app.test_client() as testing_client:
            yield testing_client
        db.session.remove()
        db.drop_all()


def _login(client, email, password):
    return client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )


def _admin_headers(client):
    body = _login(client, "admin@peoplepay360.com", "Admin@123").get_json()
    return {"Authorization": f"Bearer {body['access_token']}"}


# ── Security headers (CORS preserved for the frontend) ───────────
def test_security_headers_present(sec_client):
    response = sec_client.get("/api/auth/me")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "no-referrer"
    # Existing frontend integration still allowed.
    assert response.headers.get("Access-Control-Allow-Origin") == "*"


# ── No secret leakage in responses ───────────────────────────────
def test_no_secrets_in_auth_responses(sec_client):
    login = _login(sec_client, "admin@peoplepay360.com", "Admin@123")
    body = login.get_json()
    blob = str(body).lower()
    for forbidden in ("password_hash", "jwt_secret", "mail_password", "database_url"):
        assert forbidden not in blob
    assert "password" not in body["user"]

    admin = {"Authorization": f"Bearer {body['access_token']}"}
    users = sec_client.get("/api/users", headers=admin).get_json()
    assert users
    blob = str(users).lower()
    assert "password_hash" not in blob
    assert "password" not in blob.replace("password\": \"", "")

    me = sec_client.get("/api/auth/me", headers=admin).get_json()
    assert "password_hash" not in str(me).lower()


# ── Malformed / hostile input ────────────────────────────────────
def test_login_sql_injection_style_email(sec_client):
    response = sec_client.post(
        "/api/auth/login",
        json={"email": "' OR '1'='1", "password": "x"},
    )
    assert response.status_code == 401
    assert response.get_json() == {"detail": "Invalid credentials."}


def test_login_malformed_body(sec_client):
    response = sec_client.post(
        "/api/auth/login", data="not-json", content_type="application/json"
    )
    assert response.status_code == 401


def test_register_missing_password(sec_client):
    response = sec_client.post(
        "/api/auth/register",
        json={"email": "n@example.com", "full_name": "N"},
    )
    assert response.status_code == 400


def test_register_duplicate_email(sec_client):
    payload = {
        "email": "dupe@example.com",
        "password": "S3cure!",
        "full_name": "Dupe",
    }
    assert sec_client.post("/api/auth/register", json=payload).status_code == 201
    assert sec_client.post("/api/auth/register", json=payload).status_code == 400


def test_refresh_token_cannot_access_payroll(sec_client):
    body = _login(sec_client, "admin@peoplepay360.com", "Admin@123").get_json()
    response = sec_client.get(
        "/api/payruns",
        headers={"Authorization": f"Bearer {body['refresh_token']}"},
    )
    assert response.status_code == 401


# ── Self-protection ──────────────────────────────────────────────
def test_admin_cannot_deactivate_self(sec_client):
    admin = _admin_headers(sec_client)
    from app.models import User

    with sec_client.application.app_context():
        own_id = str(User.query.filter_by(email="admin@peoplepay360.com").first().id)
    response = sec_client.patch(
        f"/api/users/{own_id}/status", json={"is_active": False}, headers=admin
    )
    assert response.status_code == 400
    with sec_client.application.app_context():
        assert User.query.filter_by(email="admin@peoplepay360.com").first().is_active is True


def test_admin_cannot_delete_self(sec_client):
    admin = _admin_headers(sec_client)
    from app.models import User

    with sec_client.application.app_context():
        own_id = str(User.query.filter_by(email="admin@peoplepay360.com").first().id)
    assert (
        sec_client.delete(f"/api/users/{own_id}", headers=admin).status_code
        == 400
    )


def test_users_invalid_uuid_and_role(sec_client):
    admin = _admin_headers(sec_client)
    assert sec_client.get("/api/users/not-a-uuid", headers=admin).status_code == 404
    bad_role = sec_client.post(
        "/api/users",
        json={
            "email": "z@example.com",
            "password": "S3cure!",
            "full_name": "Z",
            "role": "SUPERUSER",
        },
        headers=admin,
    )
    assert bad_role.status_code == 400
