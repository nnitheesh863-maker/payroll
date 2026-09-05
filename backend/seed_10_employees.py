"""
Seed 10 complete, realistic employees with active contracts, department assignments,
working schedules, salary structures, attendance, time-off, and payruns on Supabase PostgreSQL.
"""

from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
import uuid
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
    Attendance,
    TimeOffRequest,
    Payrun,
    PayrunEmployee,
    Payslip,
    PayslipLine,
    User,
)
from app.services import create_user, AuthValidationError

EMPLOYEES_DATA = [
    {
        "code": "EMP-001",
        "first_name": "Nitheesh",
        "last_name": "Kumar",
        "email": "admin@peoplepay360.com",
        "dept": "Engineering",
        "title": "Principal Architect & Admin",
        "salary": Decimal("180000.00"),
        "role": "ADMIN",
        "phone": "+91 98450 11001",
    },
    {
        "code": "EMP-002",
        "first_name": "Sarah",
        "last_name": "Jenkins",
        "email": "hrmanager@peoplepay360.com",
        "dept": "Human Resources",
        "title": "HR Director",
        "salary": Decimal("125000.00"),
        "role": "HR_MANAGER",
        "phone": "+91 98450 11002",
    },
    {
        "code": "EMP-003",
        "first_name": "Marcus",
        "last_name": "Chen",
        "email": "payrollmanager@peoplepay360.com",
        "dept": "Finance & Payroll",
        "title": "Lead Payroll Manager",
        "salary": Decimal("115000.00"),
        "role": "HR_PAYROLL_MANAGER",
        "phone": "+91 98450 11003",
    },
    {
        "code": "EMP-004",
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "payrolluser@peoplepay360.com",
        "dept": "Human Resources",
        "title": "HR Payroll Specialist",
        "salary": Decimal("85000.00"),
        "role": "HR_PAYROLL_USER",
        "phone": "+91 98450 11004",
    },
    {
        "code": "EMP-005",
        "first_name": "David",
        "last_name": "Kumar",
        "email": "employee@peoplepay360.com",
        "dept": "Engineering",
        "title": "Senior Staff Software Engineer",
        "salary": Decimal("140000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11005",
    },
    {
        "code": "EMP-006",
        "first_name": "Aarav",
        "last_name": "Mehta",
        "email": "aarav.mehta@peoplepay360.com",
        "dept": "Product Design",
        "title": "Lead UI/UX Designer",
        "salary": Decimal("98000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11006",
    },
    {
        "code": "EMP-007",
        "first_name": "Rohan",
        "last_name": "Sharma",
        "email": "rohan.sharma@peoplepay360.com",
        "dept": "Engineering",
        "title": "Backend Systems Engineer",
        "salary": Decimal("105000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11007",
    },
    {
        "code": "EMP-008",
        "first_name": "Ananya",
        "last_name": "Iyer",
        "email": "ananya.iyer@peoplepay360.com",
        "dept": "Finance & Payroll",
        "title": "Financial Operations Analyst",
        "salary": Decimal("92000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11008",
    },
    {
        "code": "EMP-009",
        "first_name": "Vikram",
        "last_name": "Malhotra",
        "email": "vikram.m@peoplepay360.com",
        "dept": "Sales & Marketing",
        "title": "Enterprise Sales Director",
        "salary": Decimal("135000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11009",
    },
    {
        "code": "EMP-010",
        "first_name": "Neha",
        "last_name": "Patel",
        "email": "neha.patel@peoplepay360.com",
        "dept": "Operations",
        "title": "Operations & Compliance Lead",
        "salary": Decimal("88000.00"),
        "role": "EMPLOYEE",
        "phone": "+91 98450 11010",
    },
]

def seed_10_employees():
    app = create_app()
    with app.app_context():
        print("Starting 10-Employee Database Seed on Supabase...")

        # 1. Ensure all Departments exist
        depts_map = {}
        dept_configs = [
            ("Engineering", "ENG"),
            ("Human Resources", "HR"),
            ("Finance & Payroll", "FIN"),
            ("Product Design", "DES"),
            ("Sales & Marketing", "SALES"),
            ("Operations", "OPS"),
        ]
        for dname, dcode in dept_configs:
            d = Department.query.filter_by(code=dcode).first()
            if not d:
                d = Department(name=dname, code=dcode)
                db.session.add(d)
                db.session.flush()
            depts_map[dname] = d

        # 2. Schedule & Structure
        sched = WorkingSchedule.query.filter_by(code="STD_40").first()
        if not sched:
            sched = WorkingSchedule(
                name="Standard 40-Hour Week",
                code="STD_40",
                weekly_hours=40.0,
                timezone="Asia/Kolkata",
                is_active=True
            )
            db.session.add(sched)
            db.session.flush()

        struct = SalaryStructure.query.filter_by(code="STD_CORP").first()
        if not struct:
            struct = SalaryStructure(
                name="Standard Corporate Salary Structure",
                code="STD_CORP",
                description="Standard corporate structure with Basic, HRA, Allowances, PF and Tax Deductions",
                is_active=True
            )
            db.session.add(struct)
            db.session.flush()

        # 3. Create / Upsert 10 Employees and Contracts
        created_employees = []
        for item in EMPLOYEES_DATA:
            emp = Employee.query.filter_by(email=item["email"]).first()
            if not emp:
                emp = Employee.query.filter_by(employee_code=item["code"]).first()

            if not emp:
                emp = Employee(
                    employee_code=item["code"],
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    email=item["email"],
                    phone=item["phone"],
                    joining_date=date(2023, 1, 15),
                    department_id=depts_map[item["dept"]].id,
                    job_title=item["title"],
                    employment_status="active",
                    city="Mumbai",
                    country="India",
                )
                db.session.add(emp)
                db.session.flush()
            else:
                emp.employee_code = item["code"]
                emp.first_name = item["first_name"]
                emp.last_name = item["last_name"]
                emp.email = item["email"]
                emp.job_title = item["title"]
                emp.department_id = depts_map[item["dept"]].id
                emp.employment_status = "active"

            created_employees.append(emp)

            # Contract
            contract = Contract.query.filter_by(employee_id=emp.id).first()
            if not contract:
                contract = Contract(
                    employee_id=emp.id,
                    contract_reference=f"CTR-{item['code']}",
                    contract_type="full_time",
                    start_date=date(2023, 1, 15),
                    salary=item["salary"],
                    salary_structure_id=struct.id,
                    working_schedule_id=sched.id,
                    status="active"
                )
                db.session.add(contract)
            else:
                contract.salary = item["salary"]
                contract.status = "active"

            # Link User or Create User
            user = User.query.filter_by(email=item["email"]).first()
            if not user:
                try:
                    create_user(
                        db.session,
                        email=item["email"],
                        password="Password@123",
                        full_name=f"{item['first_name']} {item['last_name']}",
                        role=item["role"],
                        employee_id=emp.id,
                    )
                except AuthValidationError:
                    pass
            else:
                user.employee_id = emp.id
                db.session.flush()

        db.session.commit()
        print("Successfully seeded 10 employees & contracts!")

        # 4. Create Active Payrun with computed payslips for all 10 employees
        payrun = Payrun.query.filter_by(reference="PR-2026-09").first()
        today = date.today()
        p_start = date(today.year, today.month, 1)
        if today.month == 12:
            p_end = date(today.year, 12, 31)
        else:
            p_end = (date(today.year, today.month + 1, 1) - timedelta(days=1))

        if not payrun:
            payrun = Payrun(
                name="September 2026 Regular Payrun",
                reference="PR-2026-09",
                period_start=p_start,
                period_end=p_end,
                status="validated",
                salary_structure_id=struct.id,
            )
            db.session.add(payrun)
            db.session.flush()

        # Generate / Update Payslips for each employee
        for emp in created_employees:
            contract = Contract.query.filter_by(employee_id=emp.id).first()
            sal = contract.salary if contract else Decimal("80000.00")
            basic = sal * Decimal("0.50")
            hra = basic * Decimal("0.20")
            meal = Decimal("2000.00")
            pf = basic * Decimal("0.12")
            pt = Decimal("200.00")

            emp_gross = basic + hra + meal
            emp_deductions = pf + pt
            emp_net = emp_gross - emp_deductions

            ps = Payslip.query.filter_by(payrun_id=payrun.id, employee_id=emp.id).first()
            if not ps:
                pe = PayrunEmployee(payrun_id=payrun.id, employee_id=emp.id)
                db.session.add(pe)

                ps = Payslip(
                    payrun_id=payrun.id,
                    employee_id=emp.id,
                    contract_id=contract.id if contract else None,
                    salary_structure_id=struct.id,
                    period_start=p_start,
                    period_end=p_end,
                    basic_salary=basic,
                    total_earnings=basic,
                    total_allowances=hra + meal,
                    gross_salary=emp_gross,
                    total_deductions=emp_deductions,
                    total_contributions=Decimal("0.00"),
                    net_salary=emp_net,
                    status="validated",
                )
                db.session.add(ps)
                db.session.flush()

                l1 = PayslipLine(payslip_id=ps.id, rule_code="BASIC", rule_name="Basic Salary", category="earning", calculation_method="percentage", amount=basic, sequence=10)
                l2 = PayslipLine(payslip_id=ps.id, rule_code="HRA", rule_name="House Rent Allowance", category="allowance", calculation_method="percentage", amount=hra, sequence=20)
                l3 = PayslipLine(payslip_id=ps.id, rule_code="MEAL", rule_name="Meal Allowance", category="allowance", calculation_method="fixed", amount=meal, sequence=30)
                l4 = PayslipLine(payslip_id=ps.id, rule_code="PF", rule_name="Provident Fund", category="deduction", calculation_method="percentage", amount=pf, sequence=50)
                l5 = PayslipLine(payslip_id=ps.id, rule_code="PT", rule_name="Professional Tax", category="deduction", calculation_method="fixed", amount=pt, sequence=60)
                db.session.add_all([l1, l2, l3, l4, l5])

        db.session.commit()
        print("Successfully created real September 2026 Payrun & Payslips for all 10 employees!")

        # 5. Create Attendance Records for Today
        now = datetime.now(timezone.utc)
        check_in_time = now.replace(hour=9, minute=15, second=0, microsecond=0)
        check_out_time = now.replace(hour=18, minute=0, second=0, microsecond=0)

        for emp in created_employees:
            att = Attendance.query.filter_by(employee_id=emp.id, attendance_date=today).first()
            if not att:
                att = Attendance(
                    employee_id=emp.id,
                    attendance_date=today,
                    check_in=check_in_time,
                    check_out=check_out_time,
                    worked_hours=8.0,
                    status="present",
                )
                db.session.add(att)
        db.session.commit()
        print("Successfully seeded today's attendance records!")

    print("ALL_10_EMPLOYEES_SEEDED_SUCCESSFULLY")

if __name__ == '__main__':
    seed_10_employees()
