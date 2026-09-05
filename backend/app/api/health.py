"""
Health-check endpoint with Database connectivity probe.
"""

from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    """Returns application and database connectivity health status."""
    db_connected = False
    db_error = None
    try:
        db.session.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        db_error = str(e)

    return jsonify({
        "status": "ok" if db_connected else "degraded",
        "database": {
            "connected": db_connected,
            "engine": "PostgreSQL (SQLAlchemy)",
            "error": db_error
        }
    }), 200
