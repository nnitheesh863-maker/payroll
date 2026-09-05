"""
Shared helpers for authenticated API tests (Phase 8).

Wraps the Flask test client so existing call sites send a Bearer token
without modification. Raw (unauthenticated) access stays available via
``AuthedClient.raw`` for explicit 401 tests.
"""

from app.services import create_user

ADMIN_EMAIL = "admin@peoplepay360.com"
ADMIN_PASSWORD = "Admin@123"


def seed_admin(session, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, role="ADMIN"):
    """Create and return an admin user in the given session."""
    user = create_user(
        session,
        email=email,
        password=password,
        full_name="Admin User",
        role=role,
    )
    session.commit()
    return user


def login_token(client, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    """Log in through the API and return the access token."""
    body = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    ).get_json()
    return body["access_token"]


def auth_headers(token):
    """Build an Authorization header for a Bearer token."""
    return {"Authorization": f"Bearer {token}"}


class AuthedClient:
    """Flask test client wrapper injecting a Bearer token per call."""

    def __init__(self, client, token):
        self.raw = client
        self.headers = auth_headers(token)

    def get(self, *args, **kwargs):
        kwargs.setdefault("headers", self.headers)
        return self.raw.get(*args, **kwargs)

    def post(self, *args, **kwargs):
        kwargs.setdefault("headers", self.headers)
        return self.raw.post(*args, **kwargs)

    def put(self, *args, **kwargs):
        kwargs.setdefault("headers", self.headers)
        return self.raw.put(*args, **kwargs)

    def patch(self, *args, **kwargs):
        kwargs.setdefault("headers", self.headers)
        return self.raw.patch(*args, **kwargs)

    def delete(self, *args, **kwargs):
        kwargs.setdefault("headers", self.headers)
        return self.raw.delete(*args, **kwargs)

    @property
    def application(self):
        return self.raw.application
