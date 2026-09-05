"""
Health-check endpoint tests (Flask test client).
These tests do NOT require a running PostgreSQL instance.
"""

import pytest

from app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update({"TESTING": True})
    with app.test_client() as testing_client:
        yield testing_client


def test_app_can_be_created():
    """Flask application factory should create an app instance."""
    app = create_app()
    assert app is not None


def test_health_returns_200(client):
    """GET /api/health should return HTTP 200."""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_returns_ok_status(client):
    """GET /api/health response body should be {"status": "ok"}."""
    response = client.get("/api/health")
    assert response.get_json() == {"status": "ok"}
