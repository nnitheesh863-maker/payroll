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
} from 'lucide-react';
import { employeeApi } from '../../services/employee.api';
import { payslipApi } from '../../services/payslip.api';
import { Employee, Contract, Attendance, TimeOffRequest, TimeOffAllocation, Payslip } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const empId = Number(id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'>('profile');
  const [isLoading, setIsLoading] = useState(true);

  const { canManageEmployees, canManageContracts } = usePermission();

  useEffect(() => {
    const loadAll = async () => {
      if (!empId) return;
      setIsLoading(true);
      try {
        const [emp, cList, aList, toList, allocList, psList] = await Promise.all([
          employeeApi.getById(empId),
          employeeApi.getContracts(empId),
          employeeApi.getAttendance(empId),
          employeeApi.getTimeOff(empId),
          employeeApi.getAllocations(empId),
          employeeApi.getPayslips(empId),
        ]);
        setEmployee(emp);
        setContracts(cList);
        setAttendance(aList);
        setTimeOffRequests(toList);
        setAllocations(allocList);
        setPayslips(psList);
      } catch (err) {
        console.error('Failed to load employee details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [empId]);

  if (isLoading) {
    return <LoadingSpinner text="Loading 360° employee profile..." />;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Employee not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')} className="mt-3">
          Back to Directory
        </Button>
      </div>
    );
  }

  const attendanceColumns: Column<Attendance>[] = [
    { key: 'attendance_date', title: 'Date' },
    {
      key: 'check_in',
      title: 'Clock In',
      render: (a) => (a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'),
    },
    {
      key: 'check_out',
      title: 'Clock Out',
      render: (a) => (a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'),
    },
    {
      key: 'worked_hours',
      title: 'Total Hours',
      render: (a) => <span className="font-mono text-xs font-semibold">{a.worked_hours}h</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (a) => <StatusBadge status={a.status} size="sm" />,
    },
  ];

  const timeOffColumns: Column<TimeOffRequest>[] = [
    {
      key: 'leave_type',
      title: 'Leave Type',
      render: (r) => <span className="font-medium text-slate-800 text-xs">{r.leave_type?.name || 'Leave'}</span>,
    },
    {
      key: 'duration',
      title: 'Period',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {r.start_date} to {r.end_date} ({r.days_count} days)
        </span>
      ),
    },
    { key: 'reason', title: 'Reason', render: (r) => <span className="text-xs text-slate-500 truncate max-w-xs">{r.reason}</span> },
    { key: 'status', title: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const payslipColumns: Column<Payslip>[] = [
    { key: 'payslip_number', title: 'Payslip No.', render: (p) => <span className="font-mono text-xs font-bold">{p.payslip_number}</span> },
    { key: 'period', title: 'Period', render: (p) => <span className="text-xs">{p.period_start} to {p.period_end}</span> },
    { key: 'gross_salary', title: 'Gross Pay', render: (p) => <span className="font-semibold text-xs text-slate-900">₹ {p.gross_salary.toLocaleString()}</span> },
    { key: 'total_deductions', title: 'Deductions', render: (p) => <span className="text-xs text-rose-600">₹ {p.total_deductions.toLocaleString()}</span> },
    { key: 'net_salary', title: 'Net Pay', render: (p) => <span className="font-bold text-xs text-emerald-600">₹ {p.net_salary.toLocaleString()}</span> },
    { key: 'status', title: 'Status', render: (p) => <StatusBadge status={p.status} size="sm" /> },
    {
      key: 'action',
      title: 'PDF',
      align: 'right',
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => payslipApi.downloadPdf(p.id, p.payslip_number)}
          icon={<Download className="h-3.5 w-3.5" />}
          className="py-1 px-2 text-xs"
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Employee List</span>
      </button>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {employee.first_name} {employee.last_name}
                </h1>
                <StatusBadge status={employee.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {employee.position} &bull; <span className="text-primary-600">{employee.department}</span> &bull; Code: <span className="font-mono">{employee.emp_code}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 mt-6 -mb-6 gap-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'profile', label: 'Overview & Profile', icon: Briefcase },
            { id: 'contracts', label: `Contracts (${contracts.length})`, icon: FileText },
            { id: 'attendance', label: 'Attendance History', icon: Clock },
            { id: 'timeoff', label: 'Leaves & Allocations', icon: CalendarOff },
            { id: 'payslips', label: `Payslips (${payslips.length})`, icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Personal & Employment Details">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-slate-400">Employee Code</dt>
                <dd className="font-semibold text-slate-800 font-mono mt-0.5">{employee.emp_code}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Joining Date</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.joining_date}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Department</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.department}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Designation</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.position}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Office Address</dt>
                <dd className="font-medium text-slate-700 mt-0.5">{employee.address || 'Corporate Headquarters'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Banking & Statutory Registrations">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-slate-400">Bank Name</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.bank_name || 'HDFC Bank'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Account Number</dt>
                <dd className="font-semibold text-slate-800 font-mono mt-0.5">{employee.bank_account_number || '••••••••'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">IFSC Code</dt>
                <dd className="font-semibold text-slate-800 font-mono mt-0.5">{employee.bank_ifsc || 'HDFC0001234'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">PAN / Tax ID</dt>
                <dd className="font-semibold text-slate-800 font-mono mt-0.5">{employee.pan_number || 'ABCDE1234F'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">UAN / PF Number</dt>
                <dd className="font-semibold text-slate-800 font-mono mt-0.5">{employee.uan_number || '100928374619'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'contracts' && (
        <Card title="Employment Contracts & Wage Structures">
          {contracts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No active contracts assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {contracts.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{c.contract_title}</h4>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Type: <span className="font-semibold text-slate-700">{c.contract_type}</span> &bull; Start Date: {c.start_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Base Wage / CTC</p>
                    <p className="text-base font-bold text-primary-600">₹ {c.wage.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card title="Recent Attendance Punch Logs" noPadding>
          <DataTable columns={attendanceColumns} data={attendance} />
        </Card>
      )}

      {activeTab === 'timeoff' && (
        <div className="space-y-6">
          {/* Allocation Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allocations.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {a.leave_type?.name || 'Leave Type'}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-slate-900">{a.remaining_days}</span>
                  <span className="text-xs text-slate-400">/ {a.allocated_days} days left</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (a.used_days / (a.allocated_days || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Card title="Time Off Requests History" noPadding>
            <DataTable columns={timeOffColumns} data={timeOffRequests} />
          </Card>
        </div>
      )}

      {activeTab === 'payslips' && (
        <Card title="Compensation & Payslip History" noPadding>
          <DataTable columns={payslipColumns} data={payslips} />
        </Card>
      )}
    </div>
  );
};
