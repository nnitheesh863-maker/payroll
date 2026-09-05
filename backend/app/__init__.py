"""
PeoplePay360 — Flask application factory.
"""

from flask import Flask, jsonify

from app.config import settings
from app.extensions import db, migrate


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # ── Configuration (from environment / .env via app.config) ────
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ── Extensions ─────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models so they are registered on db.metadata
    # (no business models in Phase 0 — package must exist for Alembic).
    from app import models as _models  # noqa: F401

    # ── Blueprints ─────────────────────────────────────────────────
    from app.api.health import health_bp
    from app.api.auth import auth_bp

    app.register_blueprint(health_bp, url_prefix=settings.API_PREFIX)
    app.register_blueprint(auth_bp, url_prefix=settings.API_PREFIX)

    # ── Root endpoint — confirms the service is online ─────────────
    @app.get("/")
    def root():
        return jsonify({"app": settings.PROJECT_NAME, "status": "online"}), 200

    # ── CORS — permissive for development (no extra dependency) ────
    @app.after_request
    def _cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    return app
