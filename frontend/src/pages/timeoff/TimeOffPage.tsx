import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  LayoutDashboard,
  Layers,
  PieChart,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../../types';

export const TimeOffPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'requests' | 'types' | 'allocations'>('dashboard');

  const [types, setTypes] = useState<TimeOffType[]>([
    { id: 1, name: 'Paid Time Off (PTO)', code: 'PTO', is_paid: 1, default_days_per_year: 20 },
    { id: 2, name: 'Sick Leave', code: 'SICK', is_paid: 1, default_days_per_year: 10 },
    { id: 3, name: 'Casual Leave', code: 'CASUAL', is_paid: 1, default_days_per_year: 6 },
    { id: 4, name: 'Unpaid Leave (LWP)', code: 'LWP', is_paid: 0, default_days_per_year: 0 },
  ]);

  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([
    {
      id: 1,
      employee_id: 1,
      leave_type_id: 1,
      leave_type: { id: 1, name: 'Paid Time Off (PTO)', code: 'PTO', is_paid: 1, default_days_per_year: 20 },
      allocated_days: 20,
      used_days: 3,
      remaining_days: 17,
      year: 2026,
    },
    {
      id: 2,
      employee_id: 1,
      leave_type_id: 2,
      leave_type: { id: 2, name: 'Sick Leave', code: 'SICK', is_paid: 1, default_days_per_year: 10 },
      allocated_days: 10,
      used_days: 1,
      remaining_days: 9,
      year: 2026,
    },
    {
      id: 3,
      employee_id: 1,
      leave_type_id: 3,
      leave_type: { id: 3, name: 'Casual Leave', code: 'CASUAL', is_paid: 1, default_days_per_year: 6 },
      allocated_days: 6,
      used_days: 0,
      remaining_days: 6,
      year: 2026,
    },
  ]);

  const [requests, setRequests] = useState<TimeOffRequest[]>([
    {
      id: 101,
      employee_id: 1,
      leave_type_id: 1,
      start_date: '10-Sep-2026',
      end_date: '12-Sep-2026',
      days_count: 3,
      status: 'APPROVED',
      reason: 'Family event & travel',
      created_at: '2026-09-01T00:00:00Z',
      employee: { id: 1, emp_code: 'EMP-001', first_name: 'Aarav', last_name: 'Mehta', department: 'Finance' },
      leave_type: { id: 1, name: 'Paid Time Off (PTO)', code: 'PTO', is_paid: 1, default_days_per_year: 20 },
    },
    {
      id: 102,
      employee_id: 2,
      leave_type_id: 2,
      start_date: '04-Sep-2026',
      end_date: '04-Sep-2026',
      days_count: 1,
      status: 'PENDING',
      reason: 'Medical consultation',
      created_at: '2026-09-02T00:00:00Z',
      employee: { id: 2, emp_code: 'EMP-002', first_name: 'Sara', last_name: 'Khan', department: 'HR' },
      leave_type: { id: 2, name: 'Sick Leave', code: 'SICK', is_paid: 1, default_days_per_year: 10 },
    },
    {
      id: 103,
      employee_id: 3,
      leave_type_id: 1,
      start_date: '18-Sep-2026',
      end_date: '19-Sep-2026',
      days_count: 2,
      status: 'PENDING',
      reason: 'Personal leave',
      created_at: '2026-09-03T00:00:00Z',
      employee: { id: 3, emp_code: 'EMP-003', first_name: 'John', last_name: 'Dsouza', department: 'Engineering' },
      leave_type: { id: 1, name: 'Paid Time Off (PTO)', code: 'PTO', is_paid: 1, default_days_per_year: 20 },
    },
  ]);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const [newRequest, setNewRequest] = useState({
    leave_type_id: 1,
    start_date: '2026-09-15',
    end_date: '2026-09-16',
    days_count: 2,
    reason: '',
  });

  const [newAllocation, setNewAllocation] = useState({
    leave_type_id: 1,
    allocated_days: 15,
    year: 2026,
  });

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = types.find((t) => t.id === Number(newRequest.leave_type_id));
    const created: TimeOffRequest = {
      id: Date.now(),
      employee_id: 1,
      leave_type_id: Number(newRequest.leave_type_id),
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: Number(newRequest.days_count),
      status: 'PENDING',
      reason: newRequest.reason || 'Personal leave request',
      created_at: new Date().toISOString(),
      employee: { id: 1, emp_code: 'EMP-001', first_name: 'Aarav', last_name: 'Mehta', department: 'Finance' },
      leave_type: typeObj,
    };
    setRequests((prev) => [created, ...prev]);
    setIsApplyModalOpen(false);
    setActiveSubTab('requests');
  };

  const handleApprove = (id: number) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    setAllocations((prev) =>
      prev.map((a) => {
        if (a.leave_type_id === req.leave_type_id && a.employee_id === req.employee_id) {
          const newUsed = a.used_days + req.days_count;
          return {
            ...a,
            used_days: newUsed,
            remaining_days: Math.max(0, a.allocated_days - newUsed),
          };
        }
        return a;
      })
    );

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
  };

  const handleRefuse = (id: number) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
  };

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = types.find((t) => t.id === Number(newAllocation.leave_type_id));
    const created: TimeOffAllocation = {
      id: Date.now(),
      employee_id: 1,
      leave_type_id: Number(newAllocation.leave_type_id),
      allocated_days: Number(newAllocation.allocated_days),
      used_days: 0,
      remaining_days: Number(newAllocation.allocated_days),
      year: newAllocation.year,
      leave_type: typeObj,
    };
    setAllocations((prev) => [created, ...prev]);
    setIsAllocationModalOpen(false);
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Time Off &amp; Leave Flow</span>
            <span className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full">
              Screen Flow 3
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Requests, Allocations, and Time Off Types consolidated under one unified view
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Apply for Time Off</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs matching Wireframe */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { key: 'requests', label: `Time Offs (${requests.length})`, icon: CalendarOff },
          { key: 'allocations', label: 'Allocations', icon: PieChart },
          { key: 'types', label: 'Time Off Types', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Allocation Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allocations.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{a.leave_type?.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {a.year}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-black text-slate-900">{a.remaining_days}</span>
                  <span className="text-xs font-medium text-slate-400">/ {a.allocated_days} days left</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (a.used_days / (a.allocated_days || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  {a.used_days} days utilized this year
                </p>
              </div>
            ))}
          </div>

          {/* Pending Approval Alert Bar */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Pending Decision: {pendingRequests.length} Leave Request(s)
                </h3>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {req.employee?.first_name} {req.employee?.last_name} ({req.employee?.department}) &bull;{' '}
                        <span className="text-blue-600">{req.leave_type?.name}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.start_date} to {req.end_date} ({req.days_count} days) &bull; <i>"{req.reason}"</i>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRefuse(req.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Refuse</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TIME OFFS (REQUESTS TABLE)                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Days</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.employee?.first_name} {r.employee?.last_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {r.leave_type?.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {r.start_date} &rarr; {r.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.days_count}d
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic">
                      "{r.reason}"
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRefuse(r.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Refuse
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TIME OFF TYPES                                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{t.name}</span>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {t.code}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Default: {t.default_days_per_year} Days / Year</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{t.is_paid ? 'Paid Leave' : 'Unpaid (LWP)'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALLOCATIONS                                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAllocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Grant New Allocation</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Allocated Days</th>
                  <th className="py-3 px-4">Days Taken</th>
                  <th className="py-3 px-4 font-bold text-slate-900">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{a.leave_type?.name}</td>
                    <td className="py-3.5 px-4 font-mono">{a.year}</td>
                    <td className="py-3.5 px-4">{a.allocated_days} days</td>
                    <td className="py-3.5 px-4 text-amber-600 font-bold">{a.used_days} days</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      {a.remaining_days} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Architectural Guidance Note matching Wireframe */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800">Time Off Flow Rules:</p>
          <p className="italic">
            Requests support a simple approval flow. For leave types that require allocation, approving leave reduces the employee's available balance.
          </p>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Apply for Time Off</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Time Off Type</label>
                <select
                  value={newRequest.leave_type_id}
                  onChange={(e) => setNewRequest({ ...newRequest, leave_type_id: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Number of Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newRequest.days_count}
                  onChange={(e) => setNewRequest({ ...newRequest, days_count: Number(e.target.value) })}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Leave</label>
                <textarea
                  rows={2}
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Provide reason for leave..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Allocation Modal */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Grant Leave Allocation</h3>
              <button onClick={() => setIsAllocationModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Time Off Type</label>
                <select
                  value={newAllocation.leave_type_id}
                  onChange={(e) => setNewAllocation({ ...newAllocation, leave_type_id: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Allocated Days</label>
                <input
                  type="number"
                  min="1"
                  value={newAllocation.allocated_days}
                  onChange={(e) => setNewAllocation({ ...newAllocation, allocated_days: Number(e.target.value) })}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
