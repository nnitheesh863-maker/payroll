import json
from typing import Dict, List, Any, Optional
from app.models.employee import Employee
from app.models.contract import Contract
from app.models.salary_structure import SalaryStructure, SalaryRule

class PayrollComputationResult:
    def __init__(
        self,
        base_wage: float,
        basic_salary: float,
        total_allowances: float,
        gross_salary: float,
        total_deductions: float,
        net_salary: float,
        employer_contributions: float,
        lines: List[Dict[str, Any]],
        working_days: float,
        attended_days: float,
        paid_leave_days: float,
        unpaid_leave_days: float,
    ):
        self.base_wage = round(base_wage, 2)
        self.basic_salary = round(basic_salary, 2)
        self.total_allowances = round(total_allowances, 2)
        self.gross_salary = round(gross_salary, 2)
        self.total_deductions = round(total_deductions, 2)
        self.net_salary = round(max(0.0, net_salary), 2)
        self.employer_contributions = round(employer_contributions, 2)
        self.lines = lines
        self.working_days = working_days
        self.attended_days = attended_days
        self.paid_leave_days = paid_leave_days
        self.unpaid_leave_days = unpaid_leave_days

    def to_dict(self) -> Dict[str, Any]:
        return {
            "base_wage": self.base_wage,
            "basic_salary": self.basic_salary,
            "total_allowances": self.total_allowances,
            "gross_salary": self.gross_salary,
            "total_deductions": self.total_deductions,
            "net_salary": self.net_salary,
            "employer_contributions": self.employer_contributions,
            "working_days": self.working_days,
            "attended_days": self.attended_days,
            "paid_leave_days": self.paid_leave_days,
            "unpaid_leave_days": self.unpaid_leave_days,
            "lines_json": json.dumps(self.lines),
        }

class PayrollCalculator:
    """
    Computes payroll line items based on contract wage, salary structure rules, and attendance / leaves.
    """

    @staticmethod
    def compute(
        employee: Employee,
        contract: Optional[Contract],
        salary_structure: Optional[SalaryStructure],
        total_working_days: float = 30.0,
        attended_days: float = 30.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
    ) -> PayrollComputationResult:
        
        base_wage = contract.wage if contract else 50000.0
        lines: List[Dict[str, Any]] = []

        # Default rules if no specific structure is assigned
        rules = []
        if salary_structure and salary_structure.rules:
            rules = sorted(salary_structure.rules, key=lambda r: r.sequence)
        
        if not rules:
            # Standard Default Rules:
            # 1. BASIC: 50% of Wage
            # 2. HRA: 20% of Wage
            # 3. SPECIAL_ALLOW: 30% of Wage
            # 4. PF: 12% of Basic
            # 5. PROF_TAX: 200 Fixed
            # 6. TDS: 5% of Gross
            rule_configs = [
                {"code": "BASIC", "name": "Basic Salary", "category": "BASIC", "rule_type": "PERCENTAGE", "amount_or_percentage": 50.0, "base_code": "WAGE", "sequence": 10},
                {"code": "HRA", "name": "House Rent Allowance", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 20.0, "base_code": "WAGE", "sequence": 20},
                {"code": "SPECIAL_ALLOW", "name": "Special Allowance", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 30.0, "base_code": "WAGE", "sequence": 30},
                {"code": "PF", "name": "Provident Fund (PF)", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12.0, "base_code": "BASIC", "sequence": 40},
                {"code": "PROF_TAX", "name": "Professional Tax", "category": "DEDUCTION", "rule_type": "FIXED", "amount_or_percentage": 200.0, "base_code": "FIXED", "sequence": 50},
                {"code": "TDS", "name": "Income Tax (TDS)", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 5.0, "base_code": "GROSS", "sequence": 60},
                {"code": "EMP_PF", "name": "Employer PF Contribution", "category": "EMPLOYER_CONTRIBUTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12.0, "base_code": "BASIC", "sequence": 70},
            ]
        else:
            rule_configs = [
                {
                    "code": r.code,
                    "name": r.name,
                    "category": r.category,
                    "rule_type": r.rule_type,
                    "amount_or_percentage": r.amount_or_percentage,
                    "base_code": r.base_code,
                    "sequence": r.sequence,
                }
                for r in rules if r.is_active
            ]

        context: Dict[str, float] = {
            "WAGE": base_wage,
            "GROSS": 0.0,
            "BASIC": 0.0,
            "TOTAL_ALLOWANCES": 0.0,
            "TOTAL_DEDUCTIONS": 0.0,
        }

        basic_salary = 0.0
        total_allowances = 0.0
        total_deductions = 0.0
        employer_contributions = 0.0

        # Phase 1: Basic & Earnings / Allowances
        for r in rule_configs:
            if r["category"] in ["BASIC", "ALLOWANCE"]:
                val = 0.0
                if r["rule_type"] == "PERCENTAGE":
                    base_val = context.get(r["base_code"] or "WAGE", base_wage)
                    val = (r["amount_or_percentage"] / 100.0) * base_val
                elif r["rule_type"] == "FIXED":
                    val = r["amount_or_percentage"]
                
                val = round(val, 2)
                context[r["code"]] = val

                if r["category"] == "BASIC":
                    basic_salary += val
                    context["BASIC"] = basic_salary
                else:
                    total_allowances += val
                
                lines.append({
                    "code": r["code"],
                    "name": r["name"],
                    "category": r["category"],
                    "rate_or_percentage": r["amount_or_percentage"],
                    "amount": val,
                })

        gross_salary = basic_salary + total_allowances
        context["GROSS"] = gross_salary

        # Phase 2: Unpaid Leave / Loss of Pay (LOP) Deduction
        lop_amount = 0.0
        if unpaid_leave_days > 0 and total_working_days > 0:
            lop_per_day = base_wage / total_working_days
            lop_amount = round(lop_per_day * unpaid_leave_days, 2)
            total_deductions += lop_amount
            lines.append({
                "code": "LOP",
                "name": f"Loss of Pay ({unpaid_leave_days} unpaid days)",
                "category": "DEDUCTION",
                "rate_or_percentage": round(unpaid_leave_days, 1),
                "amount": lop_amount,
            })

        # Phase 3: Deductions & Employer Contributions
        for r in rule_configs:
            if r["category"] == "DEDUCTION":
                val = 0.0
                if r["rule_type"] == "PERCENTAGE":
                    base_val = context.get(r["base_code"] or "GROSS", gross_salary)
                    val = (r["amount_or_percentage"] / 100.0) * base_val
                elif r["rule_type"] == "FIXED":
                    val = r["amount_or_percentage"]
                
                val = round(val, 2)
                context[r["code"]] = val
                total_deductions += val

                lines.append({
                    "code": r["code"],
                    "name": r["name"],
                    "category": r["category"],
                    "rate_or_percentage": r["amount_or_percentage"],
                    "amount": val,
                })
            
            elif r["category"] == "EMPLOYER_CONTRIBUTION":
                val = 0.0
                if r["rule_type"] == "PERCENTAGE":
                    base_val = context.get(r["base_code"] or "BASIC", basic_salary)
                    val = (r["amount_or_percentage"] / 100.0) * base_val
                elif r["rule_type"] == "FIXED":
                    val = r["amount_or_percentage"]
                
                val = round(val, 2)
                employer_contributions += val

                lines.append({
                    "code": r["code"],
                    "name": r["name"],
                    "category": r["category"],
                    "rate_or_percentage": r["amount_or_percentage"],
                    "amount": val,
                })

        net_salary = max(0.0, gross_salary - total_deductions)

        return PayrollComputationResult(
            base_wage=base_wage,
            basic_salary=basic_salary,
            total_allowances=total_allowances,
            gross_salary=gross_salary,
            total_deductions=total_deductions,
            net_salary=net_salary,
            employer_contributions=employer_contributions,
            lines=lines,
            working_days=total_working_days,
            attended_days=attended_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
        )
