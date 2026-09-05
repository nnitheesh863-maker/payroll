# PeoplePay360 — HR & Payroll Backend

## Phase 0 — Backend Foundation

### Tech Stack

| Layer            | Technology                    |
|------------------|-------------------------------|
| Language         | Python 3.12                   |
| Framework        | Flask + Flask-SQLAlchemy + Flask-Migrate |
| Database         | PostgreSQL + SQLAlchemy 2.x   |
| Migrations       | Alembic (via Flask-Migrate)   |
| Config           | pydantic-settings + .env      |
| Testing          | Pytest                        |

### Quick Start

```bash
# 1. Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
#    Copy .env.example to .env and update DATABASE_URL with your PostgreSQL credentials.
cp .env.example .env

# 4. Create the database
#    In psql or pgAdmin:
#    CREATE DATABASE peoplepay360;

# 5. Run the dev server
flask --app app run --port 8000

# 6. Run tests
pytest -v
```

### Database migrations (no Docker required)

```bash
flask --app app db current
flask --app app db upgrade
```

### API Endpoints (Phase 0)

| Method | Path          | Description          |
|--------|---------------|----------------------|
| GET    | `/`           | Root / service info  |
| GET    | `/api/health` | Health check         |

### Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask application factory (create_app)
│   ├── config.py           # Pydantic settings (.env)
│   ├── extensions.py       # Flask-SQLAlchemy + Flask-Migrate instances
│   ├── api/
│   │   ├── __init__.py
│   │   └── health.py       # Health-check endpoint
│   ├── database/
│   │   ├── __init__.py
│   │   └── session.py      # SQLAlchemy engine & session
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/
│   ├── __init__.py
│   └── test_health.py
├── .env
├── .env.example
├── alembic.ini
├── pytest.ini
├── requirements.txt
└── README.md
```
