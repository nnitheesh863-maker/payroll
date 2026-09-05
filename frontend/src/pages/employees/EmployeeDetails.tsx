import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Building,
  CreditCard,
  FileText,
  Clock,
  CalendarOff,
  Receipt,
  Download,
  Shield,
  Plus,
  Edit2,
  Check,
  X,
  Info,
  Building2,
  UserCheck,
} from 'lucide-react';
import { employeeApi } from '../../services/employee.api';
import { contractApi } from '../../services/contract.api';
import { Employee, Contract, Attendance, TimeOffRequest, TimeOffAllocation, Payslip } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const WIREFRAME_AARAV: Employee = {
  id: 1,
  emp_code: 'EMP-001',
  first_name: 'Aarav',
  last_name: 'Mehta',
  email: 'aarav@exp.com',
  phone: '+91 98765 43210',
  department: 'Finance',
  position: 'Payroll Specialist',
  joining_date: '2026-01-01',
  status: 'ACTIVE',
  manager: 'Sara Khan',
  work_location: 'Mumbai',
  company: 'OXP Pvt Ltd',
  working_hours: '40 hours / week',
  bank_name: 'HDFC Bank',
  bank_account_number: '50200012849101',
  bank_ifsc: 'HDFC0001234',
  pan_number: 'ABCDE1234F',
};

const WIREFRAME_CONTRACTS: Contract[] = [
  {
    id: 42,
    contract_code: 'CON/2026/0042',
    employee_id: 1,
    contract_title: 'Full-Time Payroll Specialist Contract',
    contract_type: 'FULL_TIME',
    start_date: '01-Jan-26',
    end_date: '-',
    wage: 85000,
    working_hours_per_week: 40,
    salary_structure_name: 'Employee Salary',
    status: 'Running',
    notes: 'This running contract is the source for payroll calculation in the active period.',
  },
  {
    id: 11,
    contract_code: 'CON/2026/0011',
    employee_id: 1,
    contract_title: 'Initial Junior Associate Contract',
    contract_type: 'FULL_TIME',
    start_date: '01-Jul-25',
    end_date: '31-Dec-25',
    wage: 75000,
    working_hours_per_week: 40,
    salary_structure_name: 'Employee Salary',
    status: 'Expired',
    notes: 'Previous year contract expired on period completion.',
  },
];

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const empId = Number(id) || 1;

  const [employee, setEmployee] = useState<Employee>(WIREFRAME_AARAV);
  const [contracts, setContracts] = useState<Contract[]>(WIREFRAME_CONTRACTS);
  const [attendanceCount, setAttendanceCount] = useState<number>(14);
  const [timeOffCount, setTimeOffCount] = useState<number>(3);
  const [contractsCount, setContractsCount] = useState<number>(2);

  const [activeTab, setActiveTab] = useState<'work' | 'private' | 'contracts' | 'attendance' | 'timeoff'>('work');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!empId) return;
      setIsLoading(true);
      try {
        const emp = await employeeApi.getById(empId);
        if (emp) {
          setEmployee(emp);
        }
        const cList = await employeeApi.getContracts(empId);
        if (cList && cList.length > 0) {
          setContracts(cList);
          setContractsCount(cList.length);
        }
      } catch (err) {
        console.log('Using wireframe employee detail state');
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployeeData();
  }, [empId]);

  const handleStartEdit = () => {
    setEditForm({ ...employee });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const updated = { ...employee, ...editForm };
    setEmployee(updated);
    setIsEditing(false);
    try {
      await employeeApi.update(empId, editForm);
    } catch (e) {
      console.log('Saved to local view state');
    }
  };

  return (
    <div className="space-y-6 animate-fade-scale">
      {/* Top Header Breadcrumb & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Employees</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Employee / {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Main employee form with related HR actions
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<X className="h-4 w-4" />}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-4 w-4" />}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={handleStartEdit}
              className="bg-white border-slate-300 font-bold text-slate-800 hover:bg-slate-50"
            >
              Edit
            </Button>
          )}

          {/* Smart Action Buttons matching wireframe */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => navigate(`/time-off?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
            >
              <span>Time Off</span>
              <span className="bg-indigo-600 text-white rounded-md px-1.5 py-0.2 text-[11px] font-mono">
                {timeOffCount}
              </span>
            </button>

            <button
              onClick={() => navigate(`/contracts?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold hover:bg-primary-100 transition-all cursor-pointer shadow-xs"
            >
              <span>Contracts</span>
              <span className="bg-primary-600 text-white rounded-md px-1.5 py-0.2 text-[11px] font-mono">
                {contractsCount}
              </span>
            </button>

            <button
              onClick={() => navigate(`/attendance?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
            >
              <span>Attendance</span>
              <span className="bg-emerald-600 text-white rounded-md px-1.5 py-0.2 text-[11px] font-mono">
                {attendanceCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Employee Profile Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg border border-slate-700 shrink-0">
            {employee.first_name[0]}
            {employee.last_name[0]}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-xs font-semibold text-slate-300">
              {employee.position} &bull; <span className="text-primary-400">{employee.department}</span>
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {employee.email} &bull; {employee.phone || '+91 98765 43210'}
            </p>
          </div>
        </div>

        {/* Form Sub-Tabs */}
        <div className="flex border-b border-slate-800 mt-6 -mb-6 gap-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('work')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'work'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Work Information
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'private'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Private Information
          </button>
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
        {activeTab === 'work' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-xs">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.department}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Manager</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.manager || ''}
                    onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.manager || 'Sara Khan'}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Working Schedule</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.working_hours || ''}
                    onChange={(e) => setEditForm({ ...editForm, working_hours: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.working_hours || '40 hours / week'}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.company || 'OXP Pvt Ltd'}</p>
                )}
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Job Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.position || ''}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.position}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Work Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.work_location || ''}
                    onChange={(e) => setEditForm({ ...editForm, work_location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{employee.work_location || 'Mumbai'}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                    {employee.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Work Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm font-mono underline decoration-slate-300">
                    {employee.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Private Information Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
              <p className="font-bold text-slate-900 text-sm">{employee.bank_name || 'HDFC Bank'}</p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
              <p className="font-bold text-slate-900 text-sm font-mono">
                {employee.bank_account_number || '50200012849101'}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">IFSC Code</label>
              <p className="font-bold text-slate-900 text-sm font-mono">{employee.bank_ifsc || 'HDFC0001234'}</p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">PAN Number</label>
              <p className="font-bold text-slate-900 text-sm font-mono">{employee.pan_number || 'ABCDE1234F'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Useful Note Footer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="italic">
          Useful note: smart buttons should open related Contracts, Attendance and Time Off records filtered for the current employee.
        </p>
      </div>
    </div>
  );
};
