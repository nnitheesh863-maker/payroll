from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.payroll_engine.calculator import PayrollCalculator
from app.models import (
    User,
    Employee,
    Contract,
    Attendance,
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    SalaryStructure,
    SalaryRule,
    Payrun,
    Payslip,
    AuditLog,
)
from app.core.database import Base, engine

def seed_database(db: Session):
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).count() > 0:
        print("[SEED] Database already contains records. Skipping seed.")
        return

    print("[SEED] Starting comprehensive database seeding for PeoplePay360...")

    # 1. Create TimeOff Types
    leave_types_data = [
        {"code": "PAID", "name": "Paid Annual Leave", "is_paid": 1, "default_days_per_year": 18.0, "description": "Standard annual vacation allowance"},
        {"code": "CASUAL", "name": "Casual Leave", "is_paid": 1, "default_days_per_year": 12.0, "description": "Short urgent personal leaves"},
        {"code": "SICK", "name": "Medical / Sick Leave", "is_paid": 1, "default_days_per_year": 10.0, "description": "Health and medical emergencies"},
        {"code": "UNPAID", "name": "Unpaid Leave (Loss of Pay)", "is_paid": 0, "default_days_per_year": 0.0, "description": "Absence exceeding allowance resulting in pay deduction"},
    ]
    created_leave_types = {}
    for lt_data in leave_types_data:
        lt = TimeOffType(**lt_data)
        db.add(lt)
        db.commit()
        db.refresh(lt)
        created_leave_types[lt.code] = lt

    # 2. Create Salary Structures & Rules
    std_struct = SalaryStructure(
        code="STD_CORP",
        name="Standard Corporate Salary Structure",
        description="Standard structure for regular employees (Basic 50%, HRA 20%, Special 30%, PF 12%, PT 200, TDS 5%)",
        is_active=True,
    )
    db.add(std_struct)
    db.commit()
    db.refresh(std_struct)

    std_rules = [
        {"code": "BASIC", "name": "Basic Salary", "category": "BASIC", "rule_type": "PERCENTAGE", "amount_or_percentage": 50.0, "base_code": "WAGE", "sequence": 10},
        {"code": "HRA", "name": "House Rent Allowance", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 20.0, "base_code": "WAGE", "sequence": 20},
        {"code": "SPECIAL_ALLOW", "name": "Special Allowance", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 30.0, "base_code": "WAGE", "sequence": 30},
        {"code": "PF", "name": "Provident Fund (PF)", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12.0, "base_code": "BASIC", "sequence": 40},
        {"code": "PROF_TAX", "name": "Professional Tax", "category": "DEDUCTION", "rule_type": "FIXED", "amount_or_percentage": 200.0, "base_code": "FIXED", "sequence": 50},
        {"code": "TDS", "name": "Income Tax (TDS)", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 5.0, "base_code": "GROSS", "sequence": 60},
        {"code": "EMP_PF", "name": "Employer PF Share", "category": "EMPLOYER_CONTRIBUTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12.0, "base_code": "BASIC", "sequence": 70},
    ]
    for r in std_rules:
        rule = SalaryRule(salary_structure_id=std_struct.id, **r)
        db.add(rule)

    exec_struct = SalaryStructure(
        code="EXEC_TIER1",
        name="Executive Leadership Structure",
        description="Executive tier compensation structure with higher tax tier and performance components",
        is_active=True,
    )
    db.add(exec_struct)
    db.commit()
    db.refresh(exec_struct)

    exec_rules = [
        {"code": "BASIC", "name": "Basic Salary", "category": "BASIC", "rule_type": "PERCENTAGE", "amount_or_percentage": 45.0, "base_code": "WAGE", "sequence": 10},
        {"code": "HRA", "name": "Executive House Rent", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 25.0, "base_code": "WAGE", "sequence": 20},
        {"code": "EXEC_ALLOW", "name": "Executive Performance Pay", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 30.0, "base_code": "WAGE", "sequence": 30},
        {"code": "PF", "name": "Provident Fund", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12.0, "base_code": "BASIC", "sequence": 40},
        {"code": "TDS", "name": "Executive Tax TDS", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 10.0, "base_code": "GROSS", "sequence": 50},
    ]
    for r in exec_rules:
        rule = SalaryRule(salary_structure_id=exec_struct.id, **r)
        db.add(rule)
    db.commit()

    # 3. Create Sample Employees
    employees_data = [
        {
            "emp_code": "EMP001", "first_name": "Nitheesh", "last_name": "Kumar",
            "email": "admin@peoplepay360.com", "phone": "+91 98450 11223", "department": "Management",
            "position": "Chief Executive & System Admin", "joining_date": date(2023, 1, 15),
            "bank_account_number": "50200012849101", "bank_name": "HDFC Bank", "bank_ifsc": "HDFC0001234",
            "pan_number": "ABCDE1234F", "uan_number": "100928374619", "wage": 180000.0, "struct": exec_struct
        },
        {
            "emp_code": "EMP002", "first_name": "Sarah", "last_name": "Jenkins",
            "email": "hrmanager@peoplepay360.com", "phone": "+91 98450 22334", "department": "HR & Talent",
            "position": "Director of Human Resources", "joining_date": date(2023, 3, 1),
            "bank_account_number": "50200023950212", "bank_name": "ICICI Bank", "bank_ifsc": "ICIC0000987",
            "pan_number": "BGHYU8876K", "uan_number": "100928374620", "wage": 120000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP003", "first_name": "David", "last_name": "Chen",
            "email": "payrollmanager@peoplepay360.com", "phone": "+91 98450 33445", "department": "Finance & Payroll",
            "position": "Lead Payroll Manager", "joining_date": date(2023, 4, 10),
            "bank_account_number": "50200034061323", "bank_name": "State Bank of India", "bank_ifsc": "SBIN0004567",
            "pan_number": "CXVBN4455P", "uan_number": "100928374621", "wage": 110000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP004", "first_name": "Priya", "last_name": "Sharma",
            "email": "payrolluser@peoplepay360.com", "phone": "+91 98450 44556", "department": "Finance & Payroll",
            "position": "Senior Payroll Specialist", "joining_date": date(2023, 6, 15),
            "bank_account_number": "50200045172434", "bank_name": "Axis Bank", "bank_ifsc": "UTIB0001289",
            "pan_number": "DFRTY9988Q", "uan_number": "100928374622", "wage": 85000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP005", "first_name": "Rahul", "last_name": "Verma",
            "email": "employee@peoplepay360.com", "phone": "+91 98450 55667", "department": "Engineering",
            "position": "Senior Full-Stack Engineer", "joining_date": date(2023, 7, 1),
            "bank_account_number": "50200056283545", "bank_name": "HDFC Bank", "bank_ifsc": "HDFC0001234",
            "pan_number": "ERTYU1122W", "uan_number": "100928374623", "wage": 95000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP006", "first_name": "Ananya", "last_name": "Iyer",
            "email": "ananya.iyer@peoplepay360.com", "phone": "+91 98450 66778", "department": "Engineering",
            "position": "Frontend Architect", "joining_date": date(2023, 8, 15),
            "bank_account_number": "50200067394656", "bank_name": "Kotak Mahindra", "bank_ifsc": "KKBK0000432",
            "pan_number": "GHJKL3344R", "uan_number": "100928374624", "wage": 105000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP007", "first_name": "Marcus", "last_name": "Vance",
            "email": "marcus.vance@peoplepay360.com", "phone": "+91 98450 77889", "department": "Product & Design",
            "position": "Lead UX/UI Designer", "joining_date": date(2023, 9, 20),
            "bank_account_number": "50200078405767", "bank_name": "HDFC Bank", "bank_ifsc": "HDFC0001234",
            "pan_number": "POIUZ7766T", "uan_number": "100928374625", "wage": 88000.0, "struct": std_struct
        },
        {
            "emp_code": "EMP008", "first_name": "Kavita", "last_name": "Patel",
            "email": "kavita.patel@peoplepay360.com", "phone": "+91 98450 88990", "department": "Sales & Marketing",
            "position": "Enterprise Account Executive", "joining_date": date(2023, 11, 1),
            "bank_account_number": "50200089516878", "bank_name": "Standard Chartered", "bank_ifsc": "SCBL0036001",
            "pan_number": "MNBVC5544Y", "uan_number": "100928374626", "wage": 78000.0, "struct": std_struct
        },
    ]

    created_employees = []
    for ed in employees_data:
        struct = ed.pop("struct")
        wage = ed.pop("wage")
        emp = Employee(**ed, address="Bangalore Corporate Campus, Tech Core 3")
        db.add(emp)
        db.commit()
        db.refresh(emp)
        created_employees.append(emp)

        # Create Active Contract
        contract = Contract(
            employee_id=emp.id,
            contract_title=f"Permanent Full-Time Agreement - {emp.first_name}",
            contract_type="FULL_TIME",
            start_date=emp.joining_date,
            wage=wage,
            working_hours_per_week=40.0,
            salary_structure_id=struct.id,
            status="ACTIVE",
        )
        db.add(contract)

        # Create Leave Allocations
        for lt_code, lt_obj in created_leave_types.items():
            if lt_obj.is_paid == 1:
                alloc = TimeOffAllocation(
                    employee_id=emp.id,
                    leave_type_id=lt_obj.id,
                    year=2026,
                    allocated_days=lt_obj.default_days_per_year,
                    used_days=2.0 if emp.emp_code == "EMP005" else 0.0,
                    remaining_days=lt_obj.default_days_per_year - (2.0 if emp.emp_code == "EMP005" else 0.0),
                )
                db.add(alloc)

        # Generate 14 days of recent attendance logs
        today = date.today()
        for d_offset in range(14, -1, -1):
            att_date = today - timedelta(days=d_offset)
            if att_date.weekday() < 5: # Mon-Fri
                cin = datetime.combine(att_date, datetime.min.time()).replace(hour=9, minute=15)
                cout = datetime.combine(att_date, datetime.min.time()).replace(hour=18, minute=0)
                att = Attendance(
                    employee_id=emp.id,
                    attendance_date=att_date,
                    check_in=cin,
                    check_out=cout,
                    worked_hours=8.75,
                    overtime_hours=0.75,
                    status="PRESENT",
                )
                db.add(att)

    db.commit()

    # 4. Create Users for the 5 roles
    users_auth = [
        {"email": "admin@peoplepay360.com", "password": "Admin@123", "full_name": "Nitheesh Kumar", "role": "ADMIN", "emp_idx": 0},
        {"email": "hrmanager@peoplepay360.com", "password": "HrManager@123", "full_name": "Sarah Jenkins", "role": "HR_MANAGER", "emp_idx": 1},
        {"email": "payrollmanager@peoplepay360.com", "password": "PayrollManager@123", "full_name": "David Chen", "role": "HR_PAYROLL_MANAGER", "emp_idx": 2},
        {"email": "payrolluser@peoplepay360.com", "password": "PayrollUser@123", "full_name": "Priya Sharma", "role": "HR_PAYROLL_USER", "emp_idx": 3},
        {"email": "employee@peoplepay360.com", "password": "Employee@123", "full_name": "Rahul Verma", "role": "EMPLOYEE", "emp_idx": 4},
    ]

    for u_data in users_auth:
        emp = created_employees[u_data["emp_idx"]]
        user = User(
            email=u_data["email"],
            hashed_password=get_password_hash(u_data["password"]),
            full_name=u_data["full_name"],
            role=u_data["role"],
            employee_id=emp.id,
            is_active=True,
        )
        db.add(user)
    db.commit()

    # 5. Create a Sample Leave Request
    emp_rahul = created_employees[4]
    timeoff_req = TimeOffRequest(
        employee_id=emp_rahul.id,
        leave_type_id=created_leave_types["PAID"].id,
        start_date=date.today() + timedelta(days=5),
        end_date=date.today() + timedelta(days=6),
        days_count=2.0,
        reason="Attending family function in native town",
        status="PENDING",
    )
    db.add(timeoff_req)
    db.commit()

    # 6. Create Previous Month's Sample Closed Payrun & Current Month Draft Payrun
    prev_month_start = date(2026, 8, 1)
    prev_month_end = date(2026, 8, 31)
    pay_date = date(2026, 8, 31)

    closed_payrun = Payrun(
        name="August 2026 Regular Payrun",
        batch_number="PR-202608-MAIN",
        period_start=prev_month_start,
        period_end=prev_month_end,
        pay_date=pay_date,
        status="PAID",
        notes="August regular monthly compensation batch processed successfully.",
    )
    db.add(closed_payrun)
    db.commit()
    db.refresh(closed_payrun)

    # Compute Payslips for Closed Payrun
    tot_gross = 0.0
    tot_ded = 0.0
    tot_net = 0.0
    tot_emp_pf = 0.0

    for emp in created_employees:
        contract = db.query(Contract).filter(Contract.employee_id == emp.id, Contract.status == "ACTIVE").first()
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first() if contract else None
        
        res = PayrollCalculator.compute(
            employee=emp,
            contract=contract,
            salary_structure=structure,
            total_working_days=31.0,
            attended_days=31.0,
            paid_leave_days=0.0,
            unpaid_leave_days=0.0,
        )

        payslip = Payslip(
            payslip_number=f"PS-202608-{emp.emp_code}",
            payrun_id=closed_payrun.id,
            employee_id=emp.id,
            contract_id=contract.id if contract else None,
            period_start=prev_month_start,
            period_end=prev_month_end,
            total_working_days=31.0,
            attended_days=31.0,
            paid_leave_days=0.0,
            unpaid_leave_days=0.0,
            base_wage=res.base_wage,
            basic_salary=res.basic_salary,
            total_allowances=res.total_allowances,
            gross_salary=res.gross_salary,
            total_deductions=res.total_deductions,
            net_salary=res.net_salary,
            employer_contributions=res.employer_contributions,
            status="PAID",
            lines_json=res.to_dict()["lines_json"],
        )
        db.add(payslip)
        tot_gross += res.gross_salary
        tot_ded += res.total_deductions
        tot_net += res.net_salary
        tot_emp_pf += res.employer_contributions

    closed_payrun.total_gross = round(tot_gross, 2)
    closed_payrun.total_deductions = round(tot_ded, 2)
    closed_payrun.total_net = round(tot_net, 2)
    closed_payrun.total_employer_contributions = round(tot_emp_pf, 2)
    closed_payrun.employee_count = len(created_employees)

    # Current Month Draft Payrun
    curr_month_start = date(2026, 9, 1)
    curr_month_end = date(2026, 9, 30)
    curr_payrun = Payrun(
        name="September 2026 Regular Payrun",
        batch_number="PR-202609-01",
        period_start=curr_month_start,
        period_end=curr_month_end,
        pay_date=date(2026, 9, 30),
        status="DRAFT",
        notes="September payroll cycle in draft stage.",
        employee_count=len(created_employees)
    )
    db.add(curr_payrun)
    db.commit()

    print("[SEED] Seeding completed successfully with 5 Role Users, 8 Employees, Structures, Attendance, Allocations and Payruns!")
