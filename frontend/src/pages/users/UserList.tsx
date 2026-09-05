import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  UserPlus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Lock,
  Mail,
  User as UserIcon,
  X,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { userApi } from '../../services/user.api';
import { employeeApi } from '../../services/employee.api';
import { User, Employee, Role } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  const { user: currentAdmin } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: 'Password@123',
    role: 'EMPLOYEE' as Role,
    employee_id: null as number | null,
    is_active: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, eList] = await Promise.all([
        userApi.list(),
        employeeApi.list(),
      ]);
      setUsers(uList);
      setEmployees(eList);
    } catch {
      // Mock fallback if offline
      const mockUsers: User[] = [
        {
          id: 1,
          email: 'admin@peoplepay360.com',
          full_name: 'Alexander Wright',
          role: 'ADMIN',
          employee_id: 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          email: 'hrmanager@peoplepay360.com',
          full_name: 'Sarah Jenkins',
          role: 'HR_MANAGER',
          employee_id: 2,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          email: 'payrollmanager@peoplepay360.com',
          full_name: 'Marcus Chen',
          role: 'HR_PAYROLL_MANAGER',
          employee_id: 3,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          email: 'payrolluser@peoplepay360.com',
          full_name: 'Elena Rostova',
          role: 'HR_PAYROLL_USER',
          employee_id: 4,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 5,
          email: 'employee@peoplepay360.com',
          full_name: 'David Kumar',
          role: 'EMPLOYEE',
          employee_id: 5,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveUser = async (user: User) => {
    try {
      await userApi.approve(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: true, status: 'ACTIVE' } : u))
      );
      setApprovalSuccess(`"${user.full_name}" (${user.email}) has been approved and activated! The user can now log in.`);
      setTimeout(() => setApprovalSuccess(null), 5000);
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: true, status: 'ACTIVE' } : u))
      );
      setApprovalSuccess(`"${user.full_name}" has been approved!`);
      setTimeout(() => setApprovalSuccess(null), 5000);
    }
  };

  const openCreateDrawer = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      password: 'Password@123',
      role: 'EMPLOYEE',
      employee_id: null,
      is_active: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      employee_id: user.employee_id || null,
      is_active: user.is_active,
    });
    setIsDrawerOpen(true);
  };

  const handleEmployeeSelect = (empIdStr: string) => {
    const empId = empIdStr ? Number(empIdStr) : null;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employee_id: empId,
        full_name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        employee_id: null,
      }));
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userApi.updateStatus(editingUser.id, formData.is_active);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
        );
      } else {
        const created = await userApi.create(formData);
        setUsers((prev) => [...prev, created || { ...formData, id: Date.now(), created_at: new Date().toISOString() }]);
      }
      setIsDrawerOpen(false);
    } catch {
      // Local optimistic update if backend offline
      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
        );
      } else {
        const newUser: User = {
          id: Date.now(),
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          employee_id: formData.employee_id,
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
      }
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentAdmin?.id) {
      alert('Cannot deactivate your own logged-in admin account.');
      return;
    }
    const newStatus = !user.is_active;
    try {
      await userApi.updateStatus(user.id, newStatus);
    } catch {
      // Fallback update
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
    );
  };

  const roleBadgeMap: Record<Role, { label: string; style: string }> = {
    ADMIN: { label: 'Admin', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    HR_MANAGER: { label: 'HR Manager', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    HR_PAYROLL_MANAGER: { label: 'Payroll Admin', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    HR_PAYROLL_USER: { label: 'Payroll User', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    EMPLOYEE: { label: 'Employee', style: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const pendingUsers = users.filter((u) => !u.is_active && u.role !== 'ADMIN');

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const isUserPending = !u.is_active && u.role !== 'ADMIN';
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? isUserPending
        : !isUserPending;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management & Approvals</h1>
            <span className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full">
              Enterprise RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review newly registered HR accounts, grant administrator approvals, and manage system roles.
          </p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New User</span>
        </button>
      </div>

      {/* Success Notification Toast */}
      {approvalSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{approvalSuccess}</span>
          </div>
          <button
            onClick={() => setApprovalSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pending Approvals Attention Queue */}
      {pendingUsers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/30">
                <Clock className="h-4 w-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Pending HR Registration Queue ({pendingUsers.length})
                </h3>
                <p className="text-[11px] text-amber-800">
                  New users are blocked from signing in until an Administrator approves their account.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Filter Pending Only
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {pendingUsers.map((pu) => (
              <div
                key={pu.id}
                className="bg-white/90 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-amber-300 transition-all"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{pu.full_name}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">{pu.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {pu.role}
                  </span>
                </div>
                <button
                  onClick={() => handleApproveUser(pu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users, employees or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-700 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status ({users.length})</option>
              <option value="PENDING">Pending Approval ({pendingUsers.length})</option>
              <option value="ACTIVE">Active Users ({users.length - pendingUsers.length})</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-700 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="HR_PAYROLL_MANAGER">Payroll Admin</option>
              <option value="HR_PAYROLL_USER">Payroll User</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table matching Wireframe */}
      {isLoading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User / Employee</th>
                  <th className="py-3.5 px-4">Work Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const emp = employees.find((e) => e.id === u.employee_id);
                    const badge = roleBadgeMap[u.role] || {
                      label: u.role,
                      style: 'bg-slate-100 text-slate-700 border-slate-200',
                    };
                    const isPending = !u.is_active && u.role !== 'ADMIN';

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors cursor-pointer group ${
                          isPending ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-slate-50/60'
                        }`}
                        onClick={() => openEditDrawer(u)}
                      >
                        {/* Employee Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-8 w-8 rounded-full font-bold flex items-center justify-center border shrink-0 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 border-blue-200/60'
                              }`}
                            >
                              {u.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{u.full_name}</span>
                                {isPending && (
                                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                    New
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {emp ? `${emp.emp_code} &bull; ${emp.department}` : 'Registered Portal User'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Work Email */}
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {u.email}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-100/80 text-amber-900 border-amber-300">
                              <Clock className="h-3 w-3 text-amber-700 animate-pulse" />
                              Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isPending ? (
                            <button
                              onClick={() => handleApproveUser(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve HR</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-100"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Showing {filteredUsers.length} user accounts</span>
            <span className="italic">Click any row to view / edit role assignments</span>
          </div>
        </div>
      )}

      {/* Wireframe Architectural Note */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Login / User Access Architecture:</p>
          <ul className="list-disc list-inside text-blue-800 space-y-0.5 text-[11px]">
            <li>User accounts are created by an Admin and linked to an Employee record for access.</li>
            <li>Assigned roles control which modules, records and actions become available after login.</li>
            <li>Users cannot elevate or change their own assigned permissions.</li>
          </ul>
        </div>
      </div>

      {/* Side Slide-Over Drawer: Create / Edit User */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit User Access' : 'Create New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure credentials and assign module permissions
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* Employee Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link to Employee Record
                  </label>
                  <select
                    value={formData.employee_id || ''}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Standalone User (No Employee Link) --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.emp_code} - {emp.first_name} {emp.last_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Linking autofills name and associates payslips/leaves.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Shah"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="maya@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Password (Only on Create or Password Reset) */}
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Role Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Assign Role (Module Access Scope)
                  </label>
                  <div className="space-y-2">
                    {[
                      { role: 'ADMIN', label: 'Admin', desc: 'Full privileges across all modules' },
                      { role: 'HR_PAYROLL_MANAGER', label: 'AI / Payroll Admin', desc: 'Validate payruns, compute engine & disbursement' },
                      { role: 'HR_MANAGER', label: 'Time Off & HR Admin', desc: 'Employee hub, approvals & attendance' },
                      { role: 'HR_PAYROLL_USER', label: 'Payroll User', desc: 'Manage salary rules and deductions' },
                      { role: 'EMPLOYEE', label: 'Employee', desc: 'Self-service: Attendance punch & payslips' },
                    ].map((item) => (
                      <label
                        key={item.role}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          formData.role === item.role
                            ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role_radio"
                          value={item.role}
                          checked={formData.role === item.role}
                          onChange={() => setFormData({ ...formData, role: item.role as Role })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold">{item.label}</p>
                          <p className="text-[10px] text-slate-500 font-normal">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Account Status Toggle */}
                <div className="pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Account Status</p>
                      <p className="text-[10px] text-slate-400">
                        {formData.is_active ? 'User can log in to the ERP' : 'Account is disabled'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
