# Models package — importing the models registers them on db.metadata
# (used by the Flask application factory and Alembic autogenerate).

from app.models.department import Department  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.employment_history import EmploymentHistory  # noqa: F401
from app.models.working_schedule import WorkingSchedule  # noqa: F401
from app.models.working_schedule_day import WorkingScheduleDay  # noqa: F401
from app.models.contract import Contract  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.time_off_type import TimeOffType  # noqa: F401
from app.models.time_off_allocation import TimeOffAllocation  # noqa: F401
from app.models.time_off_request import TimeOffRequest  # noqa: F401
from app.models.salary_structure import SalaryStructure  # noqa: F401
from app.models.salary_rule import SalaryRule  # noqa: F401
from app.models.payrun import Payrun  # noqa: F401
from app.models.payrun_employee import PayrunEmployee  # noqa: F401
from app.models.payslip import Payslip  # noqa: F401
from app.models.payslip_line import PayslipLine  # noqa: F401
