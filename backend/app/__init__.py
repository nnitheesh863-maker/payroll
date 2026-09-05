"""
PeoplePay360 — Flask application factory.
"""

from flask import Flask, jsonify

from app.config import settings
from app.extensions import db, migrate


def create_app(config_overrides: dict | None = None) -> Flask:
    """Create and configure the Flask application.

    ``config_overrides`` optionally replaces config values after the
    defaults are loaded (used by tests to point at SQLite instead of
    PostgreSQL). Production behaviour is unchanged when omitted.
    """
    app = Flask(__name__)

    # ── Configuration (from environment / .env via app.config) ────
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if config_overrides:
        app.config.update(config_overrides)

    # ── Extensions ─────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models so they are registered on db.metadata
    # (no business models in Phase 0 — package must exist for Alembic).
    from app import models as _models  # noqa: F401

    # ── Blueprints ─────────────────────────────────────────────────
    from app.api.health import health_bp
    from app.api.auth import auth_bp
    from app.api.time_off import time_off_bp
    from app.api.payroll import payroll_bp
    from app.api.dashboard import dashboard_bp
    from app.api.employees import employees_bp
    from app.api.users import users_bp
    from app.api.core_hr import contracts_bp, attendance_bp, salary_bp

    app.register_blueprint(health_bp, url_prefix=settings.API_PREFIX)
    app.register_blueprint(auth_bp, url_prefix=settings.API_PREFIX)
    app.register_blueprint(time_off_bp)
    app.register_blueprint(payroll_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(contracts_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(salary_bp)


    # ── Root endpoint — confirms the service is online ─────────────
    @app.get("/")
    def root():
        return jsonify({"app": settings.PROJECT_NAME, "status": "online"}), 200

    # ── CORS — permissive for development (no extra dependency) ────
    # Kept open so the existing frontend demo keeps working. Tighten
    # Access-Control-Allow-Origin for production behind a reverse proxy.
    @app.after_request
    def _security_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    return app
