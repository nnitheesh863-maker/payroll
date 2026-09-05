import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  User,
  Info,
  Edit2,
  Check,
  X,
  Calendar,
  AlertCircle,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { attendanceApi } from '../../services/attendance.api';
import { employeeApi } from '../../services/employee.api';
import { Attendance, Employee } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

interface WireframeAttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  manager: string;
  date: string;
  check_in: string;
  check_out: string;
  worked_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Absent';
  notes: string;
}

const WIREFRAME_ATTENDANCE_DATA: WireframeAttendanceRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: 'Aarav Mehta',
    department: 'Finance',
    manager: 'Sara Khan',
    date: '02-Sep-2026',
    check_in: '09:15',
    check_out: '18:10',
    worked_hours: 8.92,
    overtime_hours: 0.92,
    status: 'Present',
    notes: 'System-generated from biometric check in/out or manually verified by HR.',
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: 'Sara Khan',
    department: 'HR',
    manager: 'Alexander Wright',
    date: '02-Sep-2026',
    check_in: '09:18',
    check_out: '18:23',
    worked_hours: 9.08,
    overtime_hours: 1.08,
    status: 'Present',
    notes: 'Standard shift check-in recorded on time.',
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: 'John Dsouza',
    department: 'Engineering',
    manager: 'Sara Khan',
    date: '02-Sep-2026',
    check_in: '09:32',
    check_out: '17:05',
    worked_hours: 7.55,
    overtime_hours: 0.0,
    status: 'Present',
    notes: 'Late clock-in recorded, left after core hours.',
  },
  {
    id: 4,
    employee_id: 4,
    employee_name: 'Neha Patel',
    department: 'HR',
    manager: 'Sara Khan',
    date: '02-Sep-2026',
    check_in: '-',
    check_out: '-',
    worked_hours: 0.0,
    overtime_hours: 0.0,
    status: 'Absent',
    notes: 'Unplanned absence, no punch recorded for 02-Sep-2026.',
  },
];

export const AttendanceList: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<WireframeAttendanceRecord[]>(WIREFRAME_ATTENDANCE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'TODAY' | 'AARAV'>('ALL');

  // Modal / Form States
  const [selectedRecord, setSelectedRecord] = useState<WireframeAttendanceRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<WireframeAttendanceRecord>>({});

  // Create Form State
  const [newAttendance, setNewAttendance] = useState({
    employee_name: 'Aarav Mehta',
    date: '02-Sep-2026',
    check_in: '09:00',
    check_out: '18:00',
    worked_hours: 9.0,
    status: 'Present' as 'Present' | 'Absent',
    notes: 'Manual attendance log created by admin.',
  });

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'TODAY') return r.date === '02-Sep-2026';
    if (filterMode === 'AARAV') return r.employee_name === 'Aarav Mehta';

    return true;
  });

  const openRecordForm = (rec: WireframeAttendanceRecord) => {
    setSelectedRecord(rec);
    setEditFormData(rec);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const updated = { ...selectedRecord, ...editFormData };
    setRecords((prev) => prev.map((r) => (r.id === selectedRecord.id ? updated : r)));
    setSelectedRecord(updated);
    setIsEditing(false);
  };

  const handleCreateAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const created: WireframeAttendanceRecord = {
      id: Date.now(),
      employee_id: 1,
      employee_name: newAttendance.employee_name,
      department: 'Finance',
      manager: 'Sara Khan',
      date: newAttendance.date,
      check_in: newAttendance.check_in,
      check_out: newAttendance.check_out,
      worked_hours: Number(newAttendance.worked_hours),
      overtime_hours: Math.max(0, Number(newAttendance.worked_hours) - 8),
      status: newAttendance.status,
      notes: newAttendance.notes,
    };
    setRecords((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Attendance</span>
            <span className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full">
              Screen Flow 2
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            List view of employee attendance records &bull; Review raw check-in / check-out data
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Attendance</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Wireframe Screen 1 */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Quick Filter Chips */}
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Logs
          </button>

          <button
            onClick={() => setFilterMode('TODAY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'TODAY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Today (02-Sep-2026)
          </button>

          <button
            onClick={() => setFilterMode('AARAV')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'AARAV'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Employee: Aarav Mehta
          </button>

          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search attendance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Attendance Table matching Wireframe Screen 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Check In</th>
                <th className="py-3.5 px-4">Check Out</th>
                <th className="py-3.5 px-4">Worked Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No matching attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openRecordForm(r)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Employee */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {r.employee_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {r.employee_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{r.department}</p>
                        </div>
                      </div>
                    </td>

                    {/* Check In */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {r.check_in}
                    </td>

                    {/* Check Out */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {r.check_out}
                    </td>

                    {/* Worked Hours */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.worked_hours.toFixed(2)} hrs
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          r.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            r.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {r.status}
                      </span>
                    </td>

                    {/* Action Chevron */}
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>Showing {filteredRecords.length} attendance records</span>
          <span className="italic">Click any row to open the full Attendance Form</span>
        </div>
      </div>

      {/* Useful Note Footer matching Wireframe */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="italic">
          Useful note: list view should help users review raw check-in / check-out data and identify missing punches quickly.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 2: ATTENDANCE FORM MODAL / DRAWER (Attendance / Aarav Mehta / Date) */}
      {/* ========================================================================= */}
      {isFormOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFormOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
              {/* Form Header Breadcrumb matching Wireframe */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Attendance / {selectedRecord.employee_name} / {selectedRecord.date}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Form view of one attendance record &bull; Influences payroll &amp; overtime
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form Body: 2-Column Grid matching Wireframe Screen 2 */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Employee
                      </label>
                      <p className="font-bold text-slate-900 text-sm">{selectedRecord.employee_name}</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Check In Time
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.check_in || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, check_in: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 text-sm font-mono">{selectedRecord.check_in}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Check Out Time
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.check_out || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, check_out: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 text-sm font-mono">{selectedRecord.check_out}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Total Worked Hours
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.worked_hours || 0}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, worked_hours: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      ) : (
                        <p className="font-bold text-blue-600 text-base font-mono">
                          {selectedRecord.worked_hours.toFixed(2)} hrs
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Department
                      </label>
                      <p className="font-bold text-slate-900 text-sm">{selectedRecord.department}</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Manager
                      </label>
                      <p className="font-bold text-slate-900 text-sm">{selectedRecord.manager}</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          selectedRecord.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedRecord.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {selectedRecord.status}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Overtime Calculation
                      </label>
                      <p className="font-bold text-emerald-600 text-sm font-mono">
                        +{selectedRecord.overtime_hours.toFixed(2)} hrs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes Section matching Wireframe */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-bold">
                    System Audit Notes:
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 italic">
                      "{selectedRecord.notes}"
                    </div>
                  )}
                </div>

                {/* Useful Note inside Form */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                  <strong>Useful note:</strong> worked hours and overtime should be easy to read because they may later influence payroll or reporting.
                </div>

                {/* Save Button (when editing) */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Create Attendance Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Manual Attendance Log</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAttendance} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Employee Name</label>
                <select
                  value={newAttendance.employee_name}
                  onChange={(e) => setNewAttendance({ ...newAttendance, employee_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  <option value="Aarav Mehta">Aarav Mehta (Finance)</option>
                  <option value="Sara Khan">Sara Khan (HR)</option>
                  <option value="John Dsouza">John Dsouza (Engineering)</option>
                  <option value="Neha Patel">Neha Patel (HR)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Check In</label>
                  <input
                    type="time"
                    value={newAttendance.check_in}
                    onChange={(e) => setNewAttendance({ ...newAttendance, check_in: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Check Out</label>
                  <input
                    type="time"
                    value={newAttendance.check_out}
                    onChange={(e) => setNewAttendance({ ...newAttendance, check_out: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={newAttendance.status}
                  onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
