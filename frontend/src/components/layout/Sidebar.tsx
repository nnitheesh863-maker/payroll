import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  CalendarOff,
  Calculator,
  DollarSign,
  Receipt,
  ShieldCheck,
  BarChart3,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasRole, isEmployee } = usePermission();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Users,
      show: true,
    },
    {
      label: 'Contracts',
      path: '/contracts',
      icon: FileText,
      show: !isEmployee || hasRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: Clock,
      show: true,
    },
    {
      label: 'Time Off & Leaves',
      path: '/time-off',
      icon: CalendarOff,
      show: true,
    },
    {
      label: 'Salary Structures',
      path: '/salary',
      icon: Calculator,
      show: hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'Payruns (Payroll)',
      path: '/payroll',
      icon: DollarSign,
      show: hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'Payslips',
      path: '/payslips',
      icon: Receipt,
      show: true,
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      show: hasRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'User Management',
      path: '/users',
      icon: ShieldCheck,
      show: hasRole(['ADMIN']),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-sm shadow-primary-500/30">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 tracking-tight text-base leading-none">
            People<span className="text-primary-600">Pay360</span>
          </h1>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            HR & Payroll ERP
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-primary-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 border border-primary-200">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
