"""
Phase 8.2 JWT tests — token issuance, validation, expiry and identity.

SQLite-backed (in-memory). Uses the real PyJWT path through the API.
"""

from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest

from app import create_app
from app.config import settings
from app.extensions import db
from app.services import (
    AuthTokenError,
    create_access_token,
    create_user,
    decode_token,
)


@pytest.fixture()
def api_client():
    """Flask test client with one admin user."""
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


def _login(client, email="admin@peoplepay360.com", password="Admin@123"):
    return client.post(
        "/api/auth/login", json={"email": email, "password": password}
    ).get_json()


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ── Valid token ──────────────────────────────────────────────────
def test_me_with_valid_token(api_client):
    tokens = _login(api_client)
    response = api_client.get(
        "/api/auth/me", headers=_auth_header(tokens["access_token"])
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["email"] == "admin@peoplepay360.com"
    assert body["role"] == "ADMIN"
    assert "password" not in body
    assert "password_hash" not in body


def test_token_identity_matches_user(api_client):
    tokens = _login(api_client)
    claims = decode_token(tokens["access_token"])
    assert claims["role"] == "ADMIN"
    assert claims["type"] == "access"
    assert claims["sub"]


# ── Missing / malformed / invalid ────────────────────────────────
def test_me_missing_token(api_client):
    assert api_client.get("/api/auth/me").status_code == 401


def test_me_malformed_tokens(api_client):
    assert (
        api_client.get(
            "/api/auth/me", headers={"Authorization": "Bearer"}
        ).status_code
        == 401
    )
    assert (
        api_client.get(
            "/api/auth/me", headers={"Authorization": "Token abc"}
        ).status_code
        == 401
    )
    assert (
        api_client.get(
            "/api/auth/me", headers=_auth_header("not.a.jwt")
        ).status_code
        == 401
    )
    assert (
        api_client.get(
            "/api/auth/me", headers=_auth_header("garbage")
        ).status_code
        == 401
    )


def test_me_wrong_signature(api_client):
    bad = pyjwt.encode(
        {"sub": "x", "role": "ADMIN", "type": "access"},
        "a-different-secret-that-is-long-enough-1234",
        algorithm="HS256",
    )
    assert (
        api_client.get("/api/auth/me", headers=_auth_header(bad)).status_code
        == 401
    )


def test_expired_token_rejected(api_client):
    tokens = _login(api_client)
    claims = decode_token(tokens["access_token"])
    expired = pyjwt.encode(
        {
            "sub": claims["sub"],
            "role": claims["role"],
            "type": "access",
            "iat": int(
                (datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()
            ),
            "exp": int(
                (datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()
            ),
        },
        settings.JWT_SECRET_KEY,
        algorithm="HS256",
    )
    response = api_client.get("/api/auth/me", headers=_auth_header(expired))
    assert response.status_code == 401
    assert "expired" in response.get_json()["detail"].lower()

    with pytest.raises(AuthTokenError):
        decode_token(expired)


# ── Refresh flow ─────────────────────────────────────────────────
def test_refresh_issues_new_access_token(api_client):
    tokens = _login(api_client)
    response = api_client.post(
        "/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["access_token"]
    assert body["refresh_token"]

    me = api_client.get(
        "/api/auth/me", headers=_auth_header(body["access_token"])
    )
    assert me.status_code == 200


def test_refresh_rejects_access_token(api_client):
    tokens = _login(api_client)
    response = api_client.post(
        "/api/auth/refresh", json={"refresh_token": tokens["access_token"]}
    )
    assert response.status_code == 401


def test_refresh_missing_token(api_client):
    assert api_client.post("/api/auth/refresh", json={}).status_code == 401


# ── Token hygiene ────────────────────────────────────────────────
def test_token_contains_no_sensitive_data(api_client):
    tokens = _login(api_client)
    claims = pyjwt.decode(
        tokens["access_token"],
        settings.JWT_SECRET_KEY,
        algorithms=["HS256"],
        options={"verify_exp": False},
    )
    assert set(claims) <= {"sub", "role", "type", "iat", "exp"}
    for forbidden in ("password", "password_hash", "bank", "salary"):
        assert forbidden not in " ".join(map(str, claims.values())).lower()


def test_inactive_user_token_rejected(api_client):
    from app.models import User

    tokens = _login(api_client)
    with api_client.application.app_context():
        user = User.query.filter_by(email="admin@peoplepay360.com").first()
        user.is_active = False
        db.session.commit()
    response = api_client.get(
        "/api/auth/me", headers=_auth_header(tokens["access_token"])
    )
    assert response.status_code == 401
