"""
Complete database seeder for PeoplePay360 on Supabase PostgreSQL.
"""

from datetime import date, time
from decimal import Decimal
from app import create_app
from app.extensions import db
from app.models import (
    Department,
    WorkingSchedule,
    WorkingScheduleDay,
    TimeOffType,
    SalaryStructure,
    SalaryRule,
    Employee,
    Contract,
)

def seed_all():
    app = create_app()
    with app.app_context():
        # 1. Departments
        if not Department.query.first():
            d_eng = Department(name="Engineering", code="ENG")
            d_hr = Department(name="Human Resources", code="HR")
            d_fin = Department(name="Finance & Payroll", code="FIN")
            d_ops = Department(name="Operations", code="OPS")
            db.session.add_all([d_eng, d_hr, d_fin, d_ops])
            db.session.commit()
            print("Seeded Departments")

        # 2. Working Schedule
        if not WorkingSchedule.query.first():
            sched = WorkingSchedule(
                name="Standard 40-Hour Week",
                code="STD_40",
                weekly_hours=40.0,
                timezone="Asia/Kolkata",
                is_active=True
            )
            db.session.add(sched)
            db.session.flush()

            for day_num in range(5):  # Mon-Fri (0-4)
                day = WorkingScheduleDay(
                    working_schedule_id=sched.id,
                    weekday=day_num,
                    is_working_day=True,
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                    break_minutes=60,
                )
                db.session.add(day)
            db.session.commit()
            print("Seeded Working Schedule")

        # 3. Time Off Types
        if not TimeOffType.query.first():
            t1 = TimeOffType(name="Paid Annual Leave", code="PTO", requires_allocation=True, allow_negative=False, is_active=True)
            t2 = TimeOffType(name="Sick Leave", code="SL", requires_allocation=True, allow_negative=False, is_active=True)
            t3 = TimeOffType(name="Casual Leave", code="CL", requires_allocation=True, allow_negative=False, is_active=True)
            t4 = TimeOffType(name="Unpaid Leave / LOP", code="LOP", requires_allocation=False, allow_negative=True, is_active=True)
            db.session.add_all([t1, t2, t3, t4])
            db.session.commit()
            print("Seeded Time Off Types")

        # 4. Salary Structure & Rules
        if not SalaryStructure.query.first():
            st = SalaryStructure(
                name="Standard Corporate Salary Structure",
                code="STD_CORP",
                description="Standard corporate structure with Basic, HRA, Allowances, PF and Tax Deductions",
                is_active=True
            )
            db.session.add(st)
            db.session.flush()

            r1 = SalaryRule(
                salary_structure_id=st.id,
                name="Basic Salary",
                code="BASIC",
                category="earning",
                calculation_method="percentage",
                percentage=50.0,
                sequence=10,
            )
            r2 = SalaryRule(
                salary_structure_id=st.id,
                name="House Rent Allowance",
                code="HRA",
                category="allowance",
                calculation_method="percentage",
                percentage=20.0,
                sequence=20,
            )
            r3 = SalaryRule(
                salary_structure_id=st.id,
                name="Meal Allowance",
                code="MEAL",
                category="allowance",
                calculation_method="fixed",
                fixed_amount=Decimal("2000.00"),
                sequence=30,
            )
            r4 = SalaryRule(
                salary_structure_id=st.id,
                name="Provident Fund (PF)",
                code="PF",
                category="deduction",
                calculation_method="percentage",
                percentage=12.0,
                sequence=50,
            )
            r5 = SalaryRule(
                salary_structure_id=st.id,
                name="Professional Tax (PT)",
                code="PT",
                category="deduction",
                calculation_method="fixed",
                fixed_amount=Decimal("200.00"),
                sequence=60,
            )
            db.session.add_all([r1, r2, r3, r4, r5])
            db.session.commit()
            print("Seeded Salary Structure & Rules")

        # 5. Employees & Contracts
        if not Employee.query.first():
            dept_eng = Department.query.filter_by(code="ENG").first()
            dept_hr = Department.query.filter_by(code="HR").first()
            dept_fin = Department.query.filter_by(code="FIN").first()

            emp1 = Employee(
                employee_code="EMP-001",
                first_name="Nitheesh",
                last_name="Kumar",
                email="admin@peoplepay360.com",
                joining_date=date(2023, 1, 15),
                department_id=dept_eng.id if dept_eng else None,
                job_title="System Administrator & Architect",
                employment_status="active"
            )
            emp2 = Employee(
                employee_code="EMP-002",
                first_name="Sarah",
                last_name="Jenkins",
                email="hrmanager@peoplepay360.com",
                joining_date=date(2023, 3, 1),
                department_id=dept_hr.id if dept_hr else None,
                job_title="HR Director",
                employment_status="active"
            )
            emp3 = Employee(
                employee_code="EMP-003",
                first_name="Marcus",
                last_name="Chen",
                email="payrollmanager@peoplepay360.com",
                joining_date=date(2023, 4, 15),
                department_id=dept_fin.id if dept_fin else None,
                job_title="Lead Payroll Officer",
                employment_status="active"
            )
            emp4 = Employee(
                employee_code="EMP-004",
                first_name="David",
                last_name="Kumar",
                email="employee@peoplepay360.com",
                joining_date=date(2023, 6, 1),
                department_id=dept_eng.id if dept_eng else None,
                job_title="Senior Software Engineer",
                employment_status="active"
            )
            db.session.add_all([emp1, emp2, emp3, emp4])
            db.session.flush()

            struct = SalaryStructure.query.first()
            sched = WorkingSchedule.query.first()
            c1 = Contract(
                employee_id=emp1.id,
                contract_reference="CTR-EMP001",
                contract_type="full_time",
                start_date=date(2023, 1, 15),
                salary=Decimal("150000.00"),
                salary_structure_id=struct.id if struct else None,
                working_schedule_id=sched.id if sched else None,
                status="active"
            )
            c2 = Contract(
                employee_id=emp2.id,
                contract_reference="CTR-EMP002",
                contract_type="full_time",
                start_date=date(2023, 3, 1),
                salary=Decimal("95000.00"),
                salary_structure_id=struct.id if struct else None,
                working_schedule_id=sched.id if sched else None,
                status="active"
            )
            c3 = Contract(
                employee_id=emp3.id,
                contract_reference="CTR-EMP003",
                contract_type="full_time",
                start_date=date(2023, 4, 15),
                salary=Decimal("90000.00"),
                salary_structure_id=struct.id if struct else None,
                working_schedule_id=sched.id if sched else None,
                status="active"
            )
            c4 = Contract(
                employee_id=emp4.id,
                contract_reference="CTR-EMP004",
                contract_type="full_time",
                start_date=date(2023, 6, 1),
                salary=Decimal("60000.00"),
                salary_structure_id=struct.id if struct else None,
                working_schedule_id=sched.id if sched else None,
                status="active"
            )
            db.session.add_all([c1, c2, c3, c4])
            db.session.commit()
            print("Seeded Employees & Contracts")

    print("ALL_DATA_SEEDED_SUCCESSFULLY")

if __name__ == '__main__':
    seed_all()
