export type Role =
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'HR_PAYROLL_MANAGER'
  | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  employee_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Employee {
  id: number;
  emp_code: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  designation?: string;
  role?: string;
  joining_date: string;
  start_date?: string;
  wage?: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  manager?: string;
  work_location?: string;
  company?: string;
  working_hours?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_ifsc?: string;
  pan_number?: string;
  pf_number?: string;
  uan_number?: string;
  address?: string;
  emergency_contact?: string;
  profile_photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: number;
  contract_code?: string;
  employee_id: number;
  contract_title: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  wage: number;
  working_hours_per_week: number;
  salary_structure_id?: number;
  salary_structure_name?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'DRAFT' | 'Running' | 'Expired';
  notes?: string;
  created_at?: string;
  employee?: Partial<Employee>;
}

export interface Attendance {
  id: number;
  employee_id: number;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  worked_hours: number;
  overtime_hours: number;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';
  notes?: string;
  employee?: Partial<Employee>;
}

export interface TimeOffType {
  id: number;
  code: string;
  name: string;
  is_paid: number;
  default_days_per_year: number;
  description?: string;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  leave_type?: TimeOffType;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by_id?: number;
  rejection_reason?: string;
  created_at: string;
  employee?: Partial<Employee>;
  leave_type?: TimeOffType;
}

export interface SalaryRule {
  id?: number;
  salary_structure_id?: number;
  code: string;
  name: string;
  category: 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
  rule_type: 'PERCENTAGE' | 'FIXED' | 'FORMULA';
  amount_or_percentage: number;
  base_code?: string;
  formula?: string;
  fixed_amount?: number;
  sequence: number;
  is_active: boolean;
}

export interface SalaryStructure {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  rules: SalaryRule[];
}

export interface Payrun {
  id: number;
  name: string;
  batch_number: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  status: 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'CLOSED' | 'SENT';
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_contributions?: number;
  employee_count: number;
  notes?: string;
  created_at: string;
}

export interface PayslipLine {
  code: string;
  name: string;
  category: string;
  rate_or_percentage: number;
  amount: number;
}

export interface Payslip {
  id: number;
  payslip_number?: string;
  payrun_id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  contract_id?: number;
  period_start: string;
  period_end: string;
  total_working_days?: number;
  attended_days?: number;
  worked_days?: number;
  paid_leave_days?: number;
  unpaid_leave_days?: number;
  leave_days?: number;
  base_wage?: number;
  basic_salary?: number;
  hra?: number;
  special_allowance?: number;
  pf_deduction?: number;
  esi_deduction?: number;
  tds_deduction?: number;
  lop_deduction?: number;
  total_allowances?: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  employer_contributions?: number;
  status: 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'SENT';
  lines_json?: string;
  employee?: Employee;
}

export interface DashboardMetrics {
  kpis: {
    total_employees: number;
    active_employees: number;
    total_payroll_last_month: number;
    today_present: number;
    today_on_leave: number;
    today_late: number;
    pending_leave_requests: number;
    pending_payruns: number;
    pending_registrations_count?: number;
  };
  pending_users?: User[];
  salary_trends: Array<{
    month: string;
    gross_payroll: number;
    net_payroll: number;
    employee_count: number;
  }>;
  department_distribution: Array<{
    department: string;
    count: number;
    total_wage: number;
  }>;
  recent_activities: Array<{
    id: number;
    type: string;
    title: string;
    time: string;
    user: string;
  }>;
  quick_alerts: Array<{
    type: string;
    message: string;
  }>;
}
