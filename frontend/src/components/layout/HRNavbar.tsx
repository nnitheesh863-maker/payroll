import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  CalendarOff,
  DollarSign,
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Building2,
  CheckCircle2,
  FileCheck,
  Receipt,
  Calculator,
} from 'lucide-react';

export const HRNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdowns = () => setActiveDropdown(null);

  const isEmpActive = location.pathname.startsWith('/employees');
  const isConActive = location.pathname.startsWith('/contracts');
  const isAttActive = location.pathname.startsWith('/attendance');
  const isTimeOffActive = location.pathname.startsWith('/time-off');
  const isPayrollActive =
    location.pathname.startsWith('/payroll') ||
    location.pathname.startsWith('/salary') ||
    location.pathname.startsWith('/payslips');

  return (
    <nav className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between shadow-md relative z-20">
      {/* Left Navigation Pills */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {/* Module Badge / HR Brand */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80 mr-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
            HR
          </div>
        </div>

        {/* 1. Employees Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('employees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isEmpActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Employees</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {activeDropdown === 'employees' && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeDropdowns} />
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-40 text-xs">
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/employees?view=kanban');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-primary-400" />
                  <span>Employees (Kanban View)</span>
                </button>
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/employees?view=list');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <List className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Employees (List View)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 2. Contracts Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('contracts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isConActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Contracts</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {activeDropdown === 'contracts' && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeDropdowns} />
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-40 text-xs">
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/contracts');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Contracts Directory (List View)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 3. Attendance Link */}
        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Attendance</span>
        </NavLink>

        {/* 4. Time Off Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('timeoff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isTimeOffActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarOff className="h-3.5 w-3.5" />
            <span>Time Off</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {activeDropdown === 'timeoff' && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeDropdowns} />
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-40 text-xs">
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/time-off');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <CalendarOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Time Off &amp; Leave Requests</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 5. Payroll Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('payroll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isPayrollActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Payroll</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {activeDropdown === 'payroll' && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeDropdowns} />
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-40 text-xs">
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/payroll');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Payruns &amp; Batches</span>
                </button>
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/salary');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <Calculator className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Salary Structures</span>
                </button>
                <button
                  onClick={() => {
                    closeDropdowns();
                    navigate('/payslips');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 text-slate-200 flex items-center gap-2"
                >
                  <Receipt className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Payslips</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Quick Note / Status */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-slate-300 font-medium">Enterprise HR Hub active</span>
      </div>
    </nav>
  );
};
