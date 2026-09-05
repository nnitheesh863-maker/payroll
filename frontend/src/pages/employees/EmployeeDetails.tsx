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
  Sparkles,
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
  email: 'aarav.mehta@peoplepay360.com',
  phone: '+91 98765 43210',
  department: 'Finance',
  position: 'Senior Financial Analyst',
  joining_date: '2024-01-15',
  status: 'ACTIVE',
  manager: 'Sara Khan',
  work_location: 'Bangalore HQ',
  company: 'PeoplePay360 Global',
  working_hours: '40 hours / week',
  bank_name: 'HDFC Bank',
  bank_account_number: '50200012849101',
  bank_ifsc: 'HDFC0001234',
  pan_number: 'ABCDE1234F',
};

const WIREFRAME_CONTRACTS: Contract[] = [
  {
    id: 42,
    contract_code: 'CNT-001',
    employee_id: 1,
    contract_title: 'Full-Time Senior Financial Analyst',
    contract_type: 'Permanent',
    start_date: '15-Jan-2024',
    end_date: '-',
    wage: 105000,
    working_hours_per_week: 40,
    salary_structure_name: 'Standard Professional Structure',
    status: 'Running',
    notes: 'This running contract is the source for payroll calculation in the active period.',
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
  const [contractsCount, setContractsCount] = useState<number>(1);

  const [activeTab, setActiveTab] = useState<'work' | 'private'>('work');
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

  const initials = `${employee.first_name?.[0] || 'E'}${employee.last_name?.[0] || 'M'}`;

  return (
    <div className="space-y-5 antialiased font-sans text-slate-800 pb-10">
      
      {/* Top Header Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADBCE] pb-3">
        <div>
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#8C532B] hover:text-[#7B3F1B] transition-colors cursor-pointer mb-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Employees</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#381E0D] tracking-tight">
              Employee / {employee.first_name} {employee.last_name}
            </h1>
            <span className="text-[10px] font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
              {employee.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => setIsEditing(false)}
                className="text-xs border-[#EADBCE] text-[#735338]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-3.5 w-3.5" />}
                onClick={handleSaveEdit}
                className="text-xs bg-[#8C532B] hover:bg-[#7B3F1B] text-white"
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
              className="text-xs bg-white border-[#EADBCE] font-bold text-[#381E0D] hover:bg-[#FAF7F2]"
            >
              Edit Profile
            </Button>
          )}

          {/* Smart Action Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#EADBCE]">
            <button
              onClick={() => navigate(`/time-off?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-bold hover:bg-[#FEF3C7] transition-all cursor-pointer shadow-2xs"
            >
              <span>Time Off</span>
              <span className="bg-[#B45309] text-white rounded-md px-1.5 py-0.2 text-[10px] font-mono">
                {timeOffCount}
              </span>
            </button>

            <button
              onClick={() => navigate(`/contracts?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF2E8] border border-[#EADBCE] text-[#8C532B] text-xs font-bold hover:bg-[#F7EFE4] transition-all cursor-pointer shadow-2xs"
            >
              <span>Contracts</span>
              <span className="bg-[#8C532B] text-white rounded-md px-1.5 py-0.2 text-[10px] font-mono">
                {contractsCount}
              </span>
            </button>

            <button
              onClick={() => navigate(`/attendance?employee_id=${employee.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-bold hover:bg-[#DCFCE7] transition-all cursor-pointer shadow-2xs"
            >
              <span>Attendance</span>
              <span className="bg-[#15803D] text-white rounded-md px-1.5 py-0.2 text-[10px] font-mono">
                {attendanceCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 Compact & Light Sandalwood Aesthetic Employee Profile Card */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Compact Sandalwood Avatar */}
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#8C532B] to-[#B87B4C] text-white font-black text-base flex items-center justify-center shadow-xs border border-[#EADBCE] shrink-0">
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#381E0D] tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h2>
                <span className="text-[10px] font-bold bg-[#FAF2E8] text-[#8C532B] border border-[#EADBCE] px-2 py-0.5 rounded-md">
                  {employee.department}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#735338] mt-0.5">
                {employee.position} &bull; <span className="font-mono text-[#8C532B]">{employee.emp_code || `EMP-${employee.id}`}</span>
              </p>
              <p className="text-[11px] text-[#735338] font-mono mt-0.5">
                {employee.email} &bull; {employee.phone || '+91 98765 43210'}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EADBCE]">
            <div>
              <span className="text-[10px] font-bold text-[#735338] uppercase block">Joining Date</span>
              <p className="font-bold text-[#381E0D]">{employee.joining_date || '2024-01-15'}</p>
            </div>
            <div className="w-px h-6 bg-[#EADBCE]" />
            <div>
              <span className="text-[10px] font-bold text-[#735338] uppercase block">Location</span>
              <p className="font-bold text-[#381E0D]">{employee.work_location || 'Bangalore HQ'}</p>
            </div>
          </div>
        </div>

        {/* Form Sub-Tabs */}
        <div className="flex border-b border-[#EADBCE] mt-4 -mb-1 gap-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('work')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'work'
                ? 'border-[#8C532B] text-[#8C532B]'
                : 'border-transparent text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Work Information
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'private'
                ? 'border-[#8C532B] text-[#8C532B]'
                : 'border-transparent text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Private Information
          </button>
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-xs">
        {activeTab === 'work' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            {/* Column 1 */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[#735338] font-bold mb-1">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-black text-[#381E0D] text-sm">{employee.department}</p>
                )}
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Manager</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.manager || ''}
                    onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-bold text-[#381E0D] text-sm">{employee.manager || 'Sara Khan'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Working Schedule</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.working_hours || ''}
                    onChange={(e) => setEditForm({ ...editForm, working_hours: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-bold text-[#381E0D] text-sm">{employee.working_hours || '40 hours / week'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-bold text-[#381E0D] text-sm">{employee.company || 'PeoplePay360 Global'}</p>
                )}
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[#735338] font-bold mb-1">Job Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.position || ''}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-black text-[#381E0D] text-sm">{employee.position}</p>
                )}
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Work Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.work_location || ''}
                    onChange={(e) => setEditForm({ ...editForm, work_location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-bold text-[#381E0D] text-sm">{employee.work_location || 'Bangalore HQ'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Status</label>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                    {employee.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#735338] font-bold mb-1">Work Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl font-medium text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                ) : (
                  <p className="font-bold text-[#8C532B] text-sm font-mono">
                    {employee.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Private Information Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            <div>
              <label className="block text-[#735338] font-bold mb-1">Bank Name</label>
              <p className="font-bold text-[#381E0D] text-sm">{employee.bank_name || 'HDFC Bank'}</p>
            </div>

            <div>
              <label className="block text-[#735338] font-bold mb-1">Account Number</label>
              <p className="font-bold text-[#381E0D] text-sm font-mono">
                {employee.bank_account_number || '50200012849101'}
              </p>
            </div>

            <div>
              <label className="block text-[#735338] font-bold mb-1">IFSC Code</label>
              <p className="font-bold text-[#381E0D] text-sm font-mono">{employee.bank_ifsc || 'HDFC0001234'}</p>
            </div>

            <div>
              <label className="block text-[#735338] font-bold mb-1">PAN Number</label>
              <p className="font-bold text-[#381E0D] text-sm font-mono">{employee.pan_number || 'ABCDE1234F'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Useful Note Footer */}
      <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EADBCE] flex items-start gap-2.5 text-xs text-[#735338]">
        <Info className="h-4 w-4 text-[#8C532B] shrink-0 mt-0.5" />
        <p className="font-medium">
          Useful note: smart buttons open related Contracts, Attendance and Time Off records filtered for the current employee.
        </p>
      </div>
    </div>
  );
};
