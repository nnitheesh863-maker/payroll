import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserPlus, Key, UserCheck, Trash2 } from 'lucide-react';
import { userApi } from '../../services/user.api';
import { employeeApi } from '../../services/employee.api';
import { User, Employee, Role } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentAdmin } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
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
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userApi.create(formData);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        employee_id: null,
        is_active: true,
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentAdmin?.id) {
      alert('Cannot deactivate your own logged-in admin account.');
      return;
    }
    try {
      await userApi.updateStatus(user.id, !user.is_active);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to toggle status');
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin (Full Privileges)',
    HR_MANAGER: 'HR Manager',
    HR_PAYROLL_MANAGER: 'Payroll Manager (Approvals)',
    HR_PAYROLL_USER: 'Payroll Specialist (Computation)',
    EMPLOYEE: 'Employee (Self-Service)',
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      title: 'User Name',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            {u.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{u.full_name}</p>
            <p className="text-[11px] text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Assigned Role',
      render: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
          {roleLabels[u.role] || u.role}
        </span>
      ),
    },
    {
      key: 'employee',
      title: 'Linked Employee',
      render: (u) => {
        const emp = employees.find((e) => e.id === u.employee_id);
        return emp ? (
          <span className="text-xs text-slate-700 font-medium">
            {emp.emp_code} - {emp.first_name} {emp.last_name}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">No employee link</span>
        );
      },
    },
    {
      key: 'is_active',
      title: 'Account Status',
      render: (u) => (
        <span
          className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
            u.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'action',
      title: 'Toggle Status',
      align: 'right',
      render: (u) => (
        <Button
          size="sm"
          variant={u.is_active ? 'outline' : 'success'}
          onClick={() => handleToggleStatus(u)}
          className="text-xs py-1 px-2.5"
        >
          {u.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Access &amp; RBAC Security</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin console for managing user credentials, RBAC roles, and employee account linkages
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create New User
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching system users..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable columns={columns} data={users} />
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User Account"
        subtitle="Credentials will be securely hashed with bcrypt. Assign appropriate RBAC role."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Nitheesh Kumar"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@peoplepay360.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="RBAC Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { value: 'EMPLOYEE', label: 'Employee (Self-Service)' },
                { value: 'HR_MANAGER', label: 'HR Manager' },
                { value: 'HR_PAYROLL_USER', label: 'Payroll Specialist' },
                { value: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager' },
                { value: 'ADMIN', label: 'Admin (Full System Access)' },
              ]}
            />
            <Select
              label="Link to Employee Profile"
              value={formData.employee_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employee_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              options={[
                { value: '', label: '-- None (System Admin Only) --' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.emp_code} - ${emp.first_name} ${emp.last_name}`,
                })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
