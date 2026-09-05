import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Clock,
  CheckCircle2,
  LogOut,
  ChevronDown,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { attendanceApi } from '../../services/attendance.api';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { user, quickLoginAsRole } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isClocking, setIsClocking] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const data = await attendanceApi.getToday();
      setTodayAttendance(data);
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    loadTodayAttendance();
  }, [user]);

  const handlePunchToggle = async () => {
    setIsClocking(true);
    try {
      if (!todayAttendance || !todayAttendance.check_in) {
        await attendanceApi.checkIn();
      } else if (!todayAttendance.check_out) {
        await attendanceApi.checkOut();
      }
      await loadTodayAttendance();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Attendance clocking error');
    } finally {
      setIsClocking(false);
    }
  };

  const roles: { role: Role; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin (Full Access)', desc: 'Nitheesh Kumar' },
    { role: 'HR_MANAGER', label: 'HR Manager', desc: 'Sarah Jenkins (Leaves/Employees)' },
    { role: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager', desc: 'David Chen (Validates Payrun)' },
    { role: 'HR_PAYROLL_USER', label: 'Payroll Specialist', desc: 'Priya Sharma (Computes Payrun)' },
    { role: 'EMPLOYEE', label: 'Staff Employee', desc: 'Rahul Verma (Self-Service)' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search / Context */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, payroll records, contracts..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-4">
        {/* Live Clock & Punch Action */}
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600">
            <Clock className="h-3.5 w-3.5 text-primary-600" />
            <span>{currentTime}</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {todayAttendance?.check_out ? (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Shift Ended
            </span>
          ) : todayAttendance?.check_in ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePunchToggle}
              isLoading={isClocking}
              className="text-xs py-1 px-2.5 h-7 text-amber-700 hover:bg-amber-50 border-amber-300"
            >
              Clock Out
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={handlePunchToggle}
              isLoading={isClocking}
              className="text-xs py-1 px-2.5 h-7"
            >
              Clock In
            </Button>
          )}
        </div>

        {/* Quick Role Switcher for seamless testing */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold hover:bg-primary-100 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            <span>Role: {user?.role?.replace(/_/g, ' ')}</span>
            <ChevronDown className="h-3.5 w-3.5 text-primary-500" />
          </button>

          {showRoleMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch Role Persona (Instant)
                </div>
                <div className="py-1 space-y-0.5">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await quickLoginAsRole(r.role);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                        user?.role === r.role
                          ? 'bg-primary-50 text-primary-800 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <UserCheck
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          user?.role === r.role ? 'text-primary-600' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <p className="font-semibold leading-none">{r.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
