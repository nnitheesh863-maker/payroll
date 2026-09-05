import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, UserCheck, Calendar, Filter } from 'lucide-react';
import { attendanceApi } from '../../services/attendance.api';
import { Attendance } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const AttendanceList: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const { user } = useAuth();

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const [list, today] = await Promise.all([
        attendanceApi.list(),
        attendanceApi.getToday(),
      ]);
      setRecords(list);
      setTodayRecord(today);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handlePunch = async () => {
    setIsClocking(true);
    try {
      if (!todayRecord || !todayRecord.check_in) {
        await attendanceApi.checkIn();
      } else if (!todayRecord.check_out) {
        await attendanceApi.checkOut();
      }
      await loadAttendance();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Punch failed');
    } finally {
      setIsClocking(false);
    }
  };

  const columns: Column<Attendance>[] = [
    {
      key: 'attendance_date',
      title: 'Date',
      render: (a) => <span className="font-medium text-slate-900 text-xs">{a.attendance_date}</span>,
    },
    {
      key: 'check_in',
      title: 'Clock In Time',
      render: (a) => (
        <span className="text-xs text-slate-700 font-mono">
          {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
        </span>
      ),
    },
    {
      key: 'check_out',
      title: 'Clock Out Time',
      render: (a) => (
        <span className="text-xs text-slate-700 font-mono">
          {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
        </span>
      ),
    },
    {
      key: 'worked_hours',
      title: 'Worked Hours',
      render: (a) => <span className="font-mono text-xs font-bold text-slate-800">{a.worked_hours} hrs</span>,
    },
    {
      key: 'overtime_hours',
      title: 'Overtime',
      render: (a) => (
        <span className="text-xs text-slate-500 font-mono">
          {a.overtime_hours > 0 ? `+${a.overtime_hours}h` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (a) => <StatusBadge status={a.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance &amp; Time Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric punch logs, working hours, and shift duration records
          </p>
        </div>
      </div>

      {/* Live Punch Clock Widget */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Attendance Punch</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {todayRecord?.check_out
                ? `Shift concluded. Total worked: ${todayRecord.worked_hours} hours.`
                : todayRecord?.check_in
                ? `Clocked in at ${new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                : 'Not clocked in yet today.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {todayRecord?.check_out ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" /> Shift Completed
            </span>
          ) : (
            <Button
              variant={todayRecord?.check_in ? 'secondary' : 'primary'}
              size="lg"
              onClick={handlePunch}
              isLoading={isClocking}
              icon={<Clock className="h-4 w-4" />}
            >
              {todayRecord?.check_in ? 'Punch Clock Out' : 'Punch Clock In'}
            </Button>
          )}
        </div>
      </div>

      {/* Attendance Logs Table */}
      {isLoading ? (
        <LoadingSpinner text="Fetching attendance records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable columns={columns} data={records} />
        </div>
      )}
    </div>
  );
};
