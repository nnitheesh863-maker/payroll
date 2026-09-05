import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { employeeApi } from '../../services/employee.api';
import { Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    emp_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    position: 'Software Engineer',
    joining_date: new Date().toISOString().split('T')[0],
    bank_name: 'HDFC Bank',
    bank_account_number: '',
    bank_ifsc: 'HDFC0001234',
    pan_number: '',
    uan_number: '',
    address: 'Bangalore Office',
  });

  const { canManageEmployees } = usePermission();
  const navigate = useNavigate();

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await employeeApi.list({
        search: search || undefined,
        department: department || undefined,
        status: status || undefined,
      });
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [department, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmployees();
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await employeeApi.create(formData as any);
      setIsCreateModalOpen(false);
      await loadEmployees();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'emp_code',
      title: 'Code',
      render: (emp) => <span className="font-mono font-semibold text-slate-800 text-xs">{emp.emp_code}</span>,
    },
    {
      key: 'name',
      title: 'Employee Name',
      render: (emp) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center border border-primary-200 shrink-0">
            {emp.first_name[0]}
            {emp.last_name[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {emp.first_name} {emp.last_name}
            </p>
            <p className="text-[11px] text-slate-400">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      title: 'Department',
      render: (emp) => <span className="text-xs font-medium text-slate-700">{emp.department}</span>,
    },
    {
      key: 'position',
      title: 'Designation',
      render: (emp) => <span className="text-xs text-slate-600">{emp.position}</span>,
    },
    {
      key: 'joining_date',
      title: 'Joining Date',
      render: (emp) => <span className="text-xs text-slate-500">{emp.joining_date}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (emp) => <StatusBadge status={emp.status} size="sm" />,
    },
    {
      key: 'action',
      title: '',
      align: 'right',
      render: (emp) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/employees/${emp.id}`);
          }}
          className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Directory (360° Hub)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for profiles, contracts, attendance, leaves, and compensation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {canManageEmployees && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-primary-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product & Design">Product & Design</option>
            <option value="HR & Talent">HR & Talent</option>
            <option value="Finance & Payroll">Finance & Payroll</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {isLoading ? (
        <LoadingSpinner text="Fetching employees..." />
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable
            columns={columns}
            data={employees}
            onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          />
        </div>
      ) : (
        /* Kanban / Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-primary-300 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center border border-primary-200">
                    {emp.first_name[0]}
                    {emp.last_name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {emp.first_name} {emp.last_name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      {emp.emp_code}
                    </span>
                  </div>
                </div>
                <StatusBadge status={emp.status} size="sm" />
              </div>

              <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>{emp.position} &bull; {emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{emp.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Employee"
        subtitle="Create an employee profile. You can later bind contracts and create system access."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Employee Code"
              placeholder="e.g. EMP009"
              value={formData.emp_code}
              onChange={(e) => setFormData({ ...formData, emp_code: e.target.value })}
              required
            />
            <Input
              label="First Name"
              placeholder="e.g. Liam"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Gallagher"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Official Email"
              type="email"
              placeholder="liam.g@peoplepay360.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98450 99887"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Product & Design', label: 'Product & Design' },
                { value: 'HR & Talent', label: 'HR & Talent' },
                { value: 'Finance & Payroll', label: 'Finance & Payroll' },
                { value: 'Sales & Marketing', label: 'Sales & Marketing' },
              ]}
            />
            <Input
              label="Position / Role"
              placeholder="e.g. Backend Engineer"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
            <Input
              label="Joining Date"
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Banking &amp; Statutory Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Bank Name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
              <Input
                label="Bank Account No."
                placeholder="502000xxxxxx"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              />
              <Input
                label="IFSC Code"
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <Input
                label="PAN / Tax Number"
                placeholder="ABCDE1234F"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
              />
              <Input
                label="UAN / PF Number"
                placeholder="100928374619"
                value={formData.uan_number}
                onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
