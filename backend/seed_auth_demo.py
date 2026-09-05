"""
Demo auth seed — creates the five showcase users for hackathon demos.

DEMO ONLY. Run manually once per environment; never imported by the app
or the test-suite::

    python seed_auth_demo.py

Passwords come from DEMO_PASSWORD_<ROLE> environment variables so no
secret is committed. Defaults match the long-published frontend demo
credentials and are suitable ONLY for local demo databases.
"""

import os
import sys

sys.path.insert(0, ".")

from app import create_app
from app.extensions import db
from app.services import AuthValidationError, create_user

DEMO_USERS = [
    ("admin@peoplepay360.com", "Administrator", "ADMIN", "DEMO_PASSWORD_ADMIN", "Admin@123"),
    ("hrmanager@peoplepay360.com", "Sarah Jenkins", "HR_MANAGER", "DEMO_PASSWORD_HR_MANAGER", "HrManager@123"),
    (
        "payrollmanager@peoplepay360.com",
        "Marcus Chen",
        "HR_PAYROLL_MANAGER",
        "DEMO_PASSWORD_PAYROLL_MANAGER",
        "PayrollManager@123",
    ),
    (
        "payrolluser@peoplepay360.com",
        "Elena Rostova",
        "HR_PAYROLL_USER",
        "DEMO_PASSWORD_PAYROLL_USER",
        "PayrollUser@123",
    ),
    ("employee@peoplepay360.com", "David Kumar", "EMPLOYEE", "DEMO_PASSWORD_EMPLOYEE", "Employee@123"),
]


def main() -> None:
    app = create_app()
    with app.app_context():
        for email, full_name, role, env_var, default in DEMO_USERS:
            password = os.environ.get(env_var, default)
            try:
                create_user(
                    db.session,
                    email=email,
                    password=password,
                    full_name=full_name,
                    role=role,
                )
                db.session.commit()
                print(f"created {email} [{role}]")
            except AuthValidationError as err:
                db.session.rollback()
                print(f"skipped {email}: {err}")


if __name__ == "__main__":
    main()
