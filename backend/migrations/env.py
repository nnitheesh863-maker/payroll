"""
Alembic environment configuration for Flask-Migrate.

When run via ``flask db`` an application context is active, so the
database URL and metadata come from the Flask app
(``SQLALCHEMY_DATABASE_URI`` / ``db.metadata``). For plain ``alembic``
commands without an app context it falls back to ``settings.DATABASE_URL``
and the Flask-SQLAlchemy metadata, preserving the existing PostgreSQL
configuration mechanism (.env / environment variables).
"""

import os
from logging.config import fileConfig

from alembic import context
from flask import current_app
from sqlalchemy import create_engine, pool

from app.config import settings
from app.extensions import db as flask_db

# ── Alembic Config object ───────────────────────────────────────
config = context.config

if config.config_file_name is not None and os.path.exists(
    config.config_file_name
):
    fileConfig(config.config_file_name)


def _get_url() -> str:
    """Resolve the database URL, preferring the Flask app config."""
    try:
        url = current_app.config.get("SQLALCHEMY_DATABASE_URI")
    except RuntimeError:
        url = None
    return url or settings.DATABASE_URL


def _get_target_metadata():
    """Resolve target metadata, preferring the Flask-Migrate extension."""
    try:
        return current_app.extensions["migrate"].db.metadata
    except (RuntimeError, KeyError, AttributeError):
        return flask_db.metadata


# Override sqlalchemy.url with the resolved URL so both CLIs agree.
config.set_main_option("sqlalchemy.url", _get_url())

target_metadata = _get_target_metadata()


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def _get_engine():
    """Return a connectable engine, reusing the Flask engine when possible."""
    try:
        engine = current_app.extensions["migrate"].db.engine
        if engine is not None:
            return engine
    except (RuntimeError, KeyError, AttributeError):
        pass
    return create_engine(
        config.get_main_option("sqlalchemy.url"), poolclass=pool.NullPool
    )


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = _get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
