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
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { hasRole } = usePermission();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] text-blue-600',
      show: true,
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Users,
      color: 'text-[#8C532B]',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(140,83,43,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(140,83,43,0.7)] text-[#8C532B]',
      show: true,
    },
    {
      label: 'Contracts',
      path: '/contracts',
      icon: FileText,
      color: 'text-purple-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] text-purple-600',
      show: true,
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: Clock,
      color: 'text-emerald-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] text-emerald-600',
      show: true,
    },
    {
      label: 'Working Schedules',
      path: '/schedules',
      icon: CalendarOff,
      color: 'text-cyan-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] text-cyan-600',
      show: true,
    },
    {
      label: 'Time Off & Leaves',
      path: '/time-off',
      icon: CalendarOff,
      color: 'text-rose-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] text-rose-600',
      show: true,
    },
    {
      label: 'Salary Structures',
      path: '/salary',
      icon: Calculator,
      color: 'text-amber-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(217,119,6,0.6)] text-amber-600',
      show: hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'Payruns (Payroll)',
      path: '/payroll',
      icon: DollarSign,
      color: 'text-emerald-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] text-emerald-600',
      show: hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'Payslips',
      path: '/payslips',
      icon: Receipt,
      color: 'text-indigo-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] text-indigo-600',
      show: true,
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      color: 'text-teal-600',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] text-teal-600',
      show: hasRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
    },
    {
      label: 'User Management',
      path: '/users',
      icon: ShieldCheck,
      color: 'text-amber-700',
      glow: 'group-hover:drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]',
      activeGlow: 'drop-shadow-[0_0_8px_rgba(180,83,9,0.7)] text-amber-700',
      show: hasRole(['ADMIN']),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md">
      {/* Brand Header with Glowing Badge */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#EADBCE]/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#8C532B] via-[#A06439] to-[#C28556] flex items-center justify-center text-white font-bold shadow-md shadow-[#8C532B]/30 drop-shadow-[0_0_10px_rgba(140,83,43,0.4)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-black text-[#381E0D] tracking-tight text-base leading-none">
              People<span className="text-[#8C532B]">Pay360</span>
            </h1>
            <span className="text-[10px] text-[#8C532B]/80 font-bold tracking-wider uppercase flex items-center gap-1 mt-0.5">
              <Sparkles className="h-2.5 w-2.5 text-[#8C532B]" />
              HR &amp; Payroll ERP
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close mobile menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold text-[#A38A73] uppercase tracking-wider">
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
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FAF2E8] via-[#FAF7F2] to-white text-[#381E0D] shadow-xs border border-[#EADBCE]/90'
                      : 'text-[#735338] hover:bg-[#FAF7F2] hover:text-[#381E0D]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Left Neon Glow Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-gradient-to-b from-[#8C532B] to-[#B87B4C] rounded-r-full shadow-[0_0_8px_rgba(140,83,43,0.7)]" />
                    )}

                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#FAF2E8] border border-[#E8D5C0] shadow-xs'
                          : 'group-hover:bg-white group-hover:shadow-xs'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-all ${
                          isActive ? item.activeGlow : `text-[#8C532B]/70 ${item.glow}`
                        }`}
                      />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-[#EADBCE]/80 bg-[#FAF7F2]/60">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#EADBCE] shadow-xs mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#8C532B] to-[#B87B4C] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-[#8C532B]/30 drop-shadow-[0_0_6px_rgba(140,83,43,0.4)]">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-[#381E0D] truncate">{user?.full_name || 'User'}</p>
              <p className="text-[9px] font-bold text-[#8C532B] uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ') || 'EMPLOYEE'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#735338] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Pinned Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[#EADBCE]/90 flex-col shrink-0 h-screen sticky top-0 shadow-[2px_0_15px_rgba(120,53,15,0.03)] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop for Phones */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-72 max-w-[85vw] shadow-2xl border-r border-[#EADBCE] animate-in slide-in-from-left duration-300">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
