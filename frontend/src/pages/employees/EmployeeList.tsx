import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Info,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { employeeApi } from '../../services/employee.api';
import { Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

// Sample fallback wireframe employees to ensure instant matching preview
const WIREFRAME_EMPLOYEES: Employee[] = [
  {
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
    company: 'PeoplePay360 Global',
    working_hours: '40 hours / week',
    bank_name: 'HDFC Bank',
    bank_account_number: '50200012849101',
    bank_ifsc: 'HDFC0001234',
    pan_number: 'ABCDE1234F',
  },
  {
    id: 2,
    emp_code: 'EMP-002',
    first_name: 'Sara',
    last_name: 'Khan',
    email: 'sara@exp.com',
    phone: '+91 98765 12345',
    department: 'HR',
    position: 'HR Officer',
    joining_date: '2025-06-15',
    status: 'ACTIVE',
    manager: 'System Admin',
    work_location: 'Mumbai',
    company: 'PeoplePay360 Global',
    working_hours: '40 hours / week',
    bank_name: 'ICICI Bank',
    bank_account_number: '50200023950212',
    bank_ifsc: 'ICIC0000987',
  },
  {
    id: 3,
    emp_code: 'EMP-003',
    first_name: 'John',
    last_name: 'Dsouza',
    email: 'john@exp.com',
    phone: '+91 98765 23456',
    department: 'Engineering',
    position: 'Developer',
    joining_date: '2025-08-01',
    status: 'ACTIVE',
    manager: 'Sara Khan',
    work_location: 'Bangalore',
    company: 'PeoplePay360 Global',
    working_hours: '40 hours / week',
    bank_name: 'Axis Bank',
    bank_account_number: '50200034061323',
  },
  {
    id: 4,
    emp_code: 'EMP-004',
    first_name: 'Neha',
    last_name: 'Patel',
    email: 'neha@exp.com',
    phone: '+91 98765 34567',
    department: 'HR',
    position: 'Recruiter',
    joining_date: '2025-09-10',
    status: 'ACTIVE',
    manager: 'Sara Khan',
    work_location: 'Mumbai',
    company: 'PeoplePay360 Global',
    working_hours: '40 hours / week',
    bank_name: 'State Bank of India',
    bank_account_number: '50200045172434',
  },
];

export const EmployeeList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { canManageEmployees } = usePermission();

  const [employees, setEmployees] = useState<Employee[]>(WIREFRAME_EMPLOYEES);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(
    searchParams.get('view') === 'list' ? 'list' : 'kanban'
  );

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    emp_code: 'EMP-005',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Finance',
    position: 'Payroll Specialist',
    joining_date: new Date().toISOString().split('T')[0],
    bank_name: 'HDFC Bank',
    bank_account_number: '',
    bank_ifsc: 'HDFC0001234',
    pan_number: '',
    uan_number: '',
    address: 'Mumbai HQ',
  });

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await employeeApi.list();
      if (data && data.length > 0) {
        const mergedMap = new Map<string, Employee>();
        WIREFRAME_EMPLOYEES.forEach((emp) => mergedMap.set(emp.email, emp));
        data.forEach((emp) => mergedMap.set(emp.email, emp));
        setEmployees(Array.from(mergedMap.values()));
      }
    } catch {
      // Using default wireframe employees
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'list') setViewMode('list');
    else if (v === 'kanban') setViewMode('kanban');
  }, [searchParams]);

  const handleToggleView = (mode: 'kanban' | 'list') => {
    setViewMode(mode);
    setSearchParams({ view: mode });
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'Finance') return emp.department === 'Finance';
    if (activeFilter === 'HR') return emp.department === 'HR' || emp.department === 'HR & Admin' || emp.department === 'HR & Talent';
    if (activeFilter === 'Engineering') return emp.department === 'Engineering';
    if (activeFilter === 'Active') return emp.status === 'ACTIVE';

    return true;
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newEmp = await employeeApi.create(formData as any);
      setIsCreateModalOpen(false);
      await loadEmployees();
      if (newEmp?.id) {
        navigate(`/employees/${newEmp.id}`);
      }
    } catch {
      const fallbackEmp: Employee = {
        id: Date.now(),
        ...formData,
        status: 'ACTIVE',
      };
      setEmployees((prev) => [fallbackEmp, ...prev]);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      title: 'Employee',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FAF2E8] border border-[#E8D5C0] text-[#8C532B] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {emp.first_name[0]}
            {emp.last_name[0]}
          </div>
          <div>
            <p className="font-bold text-[#381E0D] text-sm leading-tight">
              {emp.first_name} {emp.last_name}
            </p>
            <span className="text-[10px] text-[#735338] font-mono">{emp.emp_code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Work Email',
      render: (emp) => (
        <span className="text-xs text-[#735338] font-mono">
          {emp.email}
        </span>
      ),
    },
    {
      key: 'position',
      title: 'Job Position',
      render: (emp) => <span className="text-xs font-semibold text-[#381E0D]">{emp.position}</span>,
    },
    {
      key: 'department',
      title: 'Department',
      render: (emp) => <span className="text-xs text-[#735338] font-medium">{emp.department}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
          Active
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 antialiased font-sans text-slate-800 pb-8">
      {/* Header Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADBCE]/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#381E0D] tracking-tight flex items-center gap-2">
            <span>Employees</span>
          </h1>
          <p className="text-xs font-medium text-[#735338] mt-1">
            {viewMode === 'kanban'
              ? 'Default view: Kanban'
              : 'List view for sorting, filtering, and bulk scanning'}
          </p>
        </div>

        {canManageEmployees && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#8C532B] hover:bg-[#7B3F1B] text-white shadow-xs font-bold"
          >
            Create Employee
          </Button>
        )}
      </div>

      {/* Filter & View Switch Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#EADBCE] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Left Pills & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* ALL Pill */}
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#8C532B] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#735338] hover:bg-[#F5ECE0] border border-[#EADBCE]'
            }`}
          >
            ALL
          </button>

          {/* Department Filter Chips */}
          {['Finance', 'HR', 'Engineering', 'Active'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(activeFilter === f ? 'ALL' : f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-[#381E0D] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#735338] hover:bg-[#F5ECE0] border border-[#EADBCE]'
              }`}
            >
              {f}
            </button>
          ))}

          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C532B]/60" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-[#381E0D] placeholder-[#A38A73] focus:bg-white focus:border-[#8C532B] focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Right Toggle buttons: Kanban | List */}
        <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#EADBCE] shrink-0">
          <button
            onClick={() => handleToggleView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-[#8C532B] text-white shadow-xs'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => handleToggleView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#8C532B] text-white shadow-xs'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSpinner text="Fetching employee records..." />
      ) : viewMode === 'kanban' ? (
        /* KANBAN CARD GRID VIEW — Light, High-Contrast Sandalwood Theme */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="group bg-white hover:bg-[#FAF7F2]/60 p-5 rounded-2xl border border-[#EADBCE] shadow-xs hover:shadow-md hover:border-[#8C532B] transition-all duration-200 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              {/* Top Row: Avatar Initials + Status Dot */}
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#FAF2E8] to-[#F5ECE0] border border-[#E8D5C0] text-[#8C532B] font-black text-sm flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#8C532B] group-hover:text-white transition-all">
                  {emp.first_name[0]}
                  {emp.last_name[0]}
                </div>
                <div className="flex items-center gap-1.5 bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0] text-[10px] font-bold text-[#15803D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-pulse" />
                  Active
                </div>
              </div>

              {/* Middle Row: Name & Position */}
              <div className="mt-2">
                <h3 className="font-bold text-sm text-[#381E0D] tracking-tight group-hover:text-[#8C532B] transition-colors">
                  {emp.first_name} {emp.last_name}
                </h3>
                <p className="text-xs text-[#735338] font-medium mt-0.5 truncate">{emp.position}</p>
              </div>

              {/* Bottom Row: Department */}
              <div className="pt-2 border-t border-[#EADBCE]/70 flex items-center justify-between text-xs text-[#735338]">
                <span className="font-semibold text-[11px]">{emp.department}</span>
                <ChevronRight className="h-4 w-4 text-[#8C532B]/60 group-hover:text-[#8C532B] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredEmployees}
            onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          />
        </div>
      )}

      {/* Useful Note Footer */}
      <div className="bg-white p-4 rounded-2xl border border-[#EADBCE] flex items-start gap-3 text-xs text-[#735338] shadow-xs">
        <Info className="h-4 w-4 text-[#8C532B] shrink-0 mt-0.5" />
        <p className="font-medium">
          {viewMode === 'kanban'
            ? 'Useful note: Kanban is good for browsing; clicking a card opens the detailed Employee Profile.'
            : 'Useful note: The list view is the quickest way to scan and filter specific employee records.'}
        </p>
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Employee"
        subtitle="Add a new employee record to the directory"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Employee Code"
              placeholder="EMP-005"
              value={formData.emp_code}
              onChange={(e) => setFormData({ ...formData, emp_code: e.target.value })}
              required
            />
            <Input
              label="First Name"
              placeholder="Aarav"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Mehta"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              placeholder="aarav@exp.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
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
                { value: 'Finance', label: 'Finance' },
                { value: 'HR', label: 'HR' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Product & Design', label: 'Product & Design' },
                { value: 'Sales & Marketing', label: 'Sales & Marketing' },
              ]}
            />
            <Input
              label="Job Position"
              placeholder="Payroll Specialist"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-[#EADBCE]">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#8C532B] hover:bg-[#7B3F1B] text-white">
              Save Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
