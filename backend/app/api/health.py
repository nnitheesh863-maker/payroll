"""
Health-check endpoint.
"""

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    """Returns application health status."""
    return jsonify({"status": "ok"}), 200
