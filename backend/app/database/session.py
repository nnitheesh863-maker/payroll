"""
SQLAlchemy configuration via Flask-SQLAlchemy.

The canonical ``db`` object lives in ``app.extensions`` and is
initialized inside the Flask application factory. This module provides
compatibility aliases so existing imports (e.g. Alembic's ``env.py``
and future models) keep working without duplicating engine setup.

PostgreSQL connection details come from ``app.config.settings``
(``DATABASE_URL`` env var / ``.env`` file) and are mapped to
``SQLALCHEMY_DATABASE_URI`` in ``create_app()`` — credentials are
never hard-coded here.
"""

from collections.abc import Generator

from app.extensions import db

# ── Declarative Base (Flask-SQLAlchemy model class) ────────────────
# ORM models in later phases should inherit from ``Base``.
Base = db.Model


# ── Session helper ─────────────────────────────────────────────────
def get_db() -> Generator:
    """Yield the Flask-SQLAlchemy scoped session."""
    yield db.session
