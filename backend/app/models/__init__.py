# Models package — importing the models registers them on db.metadata
# (used by the Flask application factory and Alembic autogenerate).

from app.models.department import Department  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.employment_history import EmploymentHistory  # noqa: F401
