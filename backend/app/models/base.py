"""
Shared model utilities for Phase 1+.

Provides a timestamp mixin so all tables carry ``created_at`` /
``updated_at`` without duplicating column definitions. Defaults are
Python-side (UTC) so the models work on PostgreSQL and on SQLite
(which the test-suite uses for model tests).
"""

from datetime import datetime, timezone

from app.extensions import db


def utcnow() -> datetime:
    """Current UTC timestamp (timezone-aware)."""
    return datetime.now(timezone.utc)


class TimestampMixin:
    """Adds ``created_at`` / ``updated_at`` columns to a model."""

    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )
