import React, { useState, useEffect } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Search,
  ArrowLeft,
  Calendar,
  Sparkles,
  PieChart,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Award,
  Filter,
  Edit2,
  Save,
} from 'lucide-react';
import {
  timeOffApi,
  TimeOffTypeItem,
  AllocationItem,
  TimeOffRequestItem,
} from '../../services/timeoff.api';

export const TimeOffPage: React.FC = () => {
  // Navigation tabs: 'dashboard' | 'requests' | 'types' | 'allocations'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'types' | 'allocations'>('dashboard');

  // Form View detail states (null = show list view, non-null = show detail form view)
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequestItem | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationItem | null>(null);
  const [selectedType, setSelectedType] = useState<TimeOffTypeItem | null>(null);
  const [isEditingType, setIsEditingType] = useState(false);

  // Filter state
  const [requestFilter, setRequestFilter] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showNewAllocModal, setShowNewAllocModal] = useState(false);
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);

  // Data state
  const [types, setTypes] = useState<TimeOffTypeItem[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [requests, setRequests] = useState<TimeOffRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Request Form
  const [newReq, setNewReq] = useState({
    employee_name: 'Aarav Mehta',
    time_off_type_name: 'Paid Time Off',
    start_date: '2026-09-18',
    end_date: '2026-09-20',
    days_count: 3,
    reason: 'Family event',
  });

  // New Allocation Form
  const [newAlloc, setNewAlloc] = useState({
    employee_name: 'Aarav Mehta',
    time_off_type_name: 'Paid Time Off',
    allocated_days: 20,
    validity: '2026 Annual Balance',
    description: 'Annual leave policy credit',
  });

  // New Type Form
  const [newType, setNewType] = useState({
    name: 'Casual Leave',
    code: 'CASUAL',
    unit: 'Days',
    requires_allocation: 'Yes',
    approval: 'Manager',
    payroll_work_entry: 'Leave Work Entry',
    display_color: 'Sandal',
    active: true,
    config_notes: 'Standard casual leaves for employees.',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tData, aData, rData] = await Promise.all([
        timeOffApi.getTypes(),
        timeOffApi.getAllocations(),
        timeOffApi.getRequests(),
      ]);
      setTypes(tData);
      setAllocations(aData);
      setRequests(rData);
    } catch {
      // Fallback in-memory
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Request Actions
  const handleApproveRequest = async (id: number) => {
    try {
      const updated = await timeOffApi.approveRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(updated);
      }
      // Re-fetch allocations to reflect deduction
      const aData = await timeOffApi.getAllocations();
      setAllocations(aData);
    } catch {
      // Local fallback
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
      );
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: 'Approved' });
      }
    }
  };

  const handleRefuseRequest = async (id: number) => {
    try {
      const updated = await timeOffApi.refuseRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(updated);
      }
    } catch {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Refused' } : r))
      );
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: 'Refused' });
      }
    }
  };

  // Allocation Actions
  const handleApproveAllocation = async (id: number) => {
    try {
      const updated = await timeOffApi.approveAllocation(id);
      setAllocations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedAllocation && selectedAllocation.id === id) {
        setSelectedAllocation(updated);
      }
    } catch {
      setAllocations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a))
      );
      if (selectedAllocation && selectedAllocation.id === id) {
        setSelectedAllocation({ ...selectedAllocation, status: 'Approved' });
      }
    }
  };

  const handleRefuseAllocation = async (id: number) => {
    try {
      const updated = await timeOffApi.refuseAllocation(id);
      setAllocations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedAllocation && selectedAllocation.id === id) {
        setSelectedAllocation(updated);
      }
    } catch {
      setAllocations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Refused' } : a))
      );
      if (selectedAllocation && selectedAllocation.id === id) {
        setSelectedAllocation({ ...selectedAllocation, status: 'Refused' });
      }
    }
  };

  // Create Submit Handlers
  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await timeOffApi.createRequest({
      employee_name: newReq.employee_name,
      time_off_type_name: newReq.time_off_type_name,
      start_date: newReq.start_date,
      end_date: newReq.end_date,
      days_count: Number(newReq.days_count),
      reason: newReq.reason,
      allocation_used: `${newReq.time_off_type_name} 2026`,
    });
    setRequests((prev) => [created, ...prev]);
    setShowNewRequestModal(false);
  };

  const handleCreateAllocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await timeOffApi.createAllocation({
      employee_name: newAlloc.employee_name,
      time_off_type_name: newAlloc.time_off_type_name,
      allocated_days: Number(newAlloc.allocated_days),
      validity: newAlloc.validity,
      description: newAlloc.description,
    });
    setAllocations((prev) => [created, ...prev]);
    setShowNewAllocModal(false);
  };

  const handleCreateTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await timeOffApi.createType(newType);
    setTypes((prev) => [...prev, created]);
    setShowNewTypeModal(false);
  };

  const handleSaveTypeEdit = async () => {
    if (!selectedType) return;
    try {
      const updated = await timeOffApi.updateType(selectedType.id, selectedType);
      setTypes((prev) => prev.map((t) => (t.id === selectedType.id ? updated : t)));
      setSelectedType(updated);
      setIsEditingType(false);
    } catch {
      setIsEditingType(false);
    }
  };

  // Filtered lists
  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.time_off_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = requestFilter === 'all' || r.employee_name === 'Aarav Mehta';
    return matchSearch && matchTab;
  });

  const filteredAllocations = allocations.filter((a) => {
    return (
      a.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.time_off_type_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredTypes = types.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4 sm:p-6 lg:p-8 font-sans text-slate-800 space-y-6 antialiased selection:bg-[#EADCC9] selection:text-[#78350F]">
      
      {/* Top Header & Integrated Sub-Navigation Bar */}
      <div className="bg-white rounded-3xl border border-[#EADBCE] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#8C532B] via-[#9E6237] to-[#B87B4C] flex items-center justify-center text-white font-bold shadow-md shadow-[#8C532B]/20">
            <CalendarOff className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#381E0D] tracking-tight flex items-center gap-2">
              Time Off &amp; Leaves
              <span className="text-[10px] font-bold text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Flow 3
              </span>
            </h1>
            <p className="text-xs text-[#735338] font-medium mt-0.5">
              Manage leave requests, balances &amp; allocations, and policy approval rules
            </p>
          </div>
        </div>

        {/* 4 Unified Sub-tabs (Dashboard, Time Offs, Allocations, Time Off Types) */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#EADBCE] self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedRequest(null);
              setSelectedAllocation(null);
              setSelectedType(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#78350F] shadow-xs border border-[#EADBCE]'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab('requests');
              setSelectedRequest(null);
              setSelectedAllocation(null);
              setSelectedType(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-[#78350F] shadow-xs border border-[#EADBCE]'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Time Offs
          </button>
          <button
            onClick={() => {
              setActiveTab('allocations');
              setSelectedRequest(null);
              setSelectedAllocation(null);
              setSelectedType(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'allocations'
                ? 'bg-white text-[#78350F] shadow-xs border border-[#EADBCE]'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Allocations
          </button>
          <button
            onClick={() => {
              setActiveTab('types');
              setSelectedRequest(null);
              setSelectedAllocation(null);
              setSelectedType(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'types'
                ? 'bg-white text-[#78350F] shadow-xs border border-[#EADBCE]'
                : 'text-[#735338] hover:text-[#381E0D]'
            }`}
          >
            Time Off Types
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: TIME OFF DASHBOARD VIEW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs">
              <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Paid Time Off (PTO)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#381E0D]">12</span>
                <span className="text-xs text-[#735338] font-bold">/ 20 days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div className="bg-[#8C532B] h-full rounded-full w-[60%]" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs">
              <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Sick Leave</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#8C532B]">8</span>
                <span className="text-xs text-[#735338] font-bold">/ 10 days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div className="bg-[#9E6237] h-full rounded-full w-[80%]" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs">
              <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Comp Off Quota</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#78350F]">1</span>
                <span className="text-xs text-[#735338] font-bold">/ 2 days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div className="bg-[#B45309] h-full rounded-full w-[50%]" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs">
              <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Approval Queue</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#B45309]">
                  {requests.filter((r) => r.status === 'To Approve').length}
                </span>
                <span className="text-xs text-[#735338] font-bold">Pending Manager Review</span>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="mt-3 text-xs font-bold text-[#8C532B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Review Requests <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Quick Actions & Recent Time Off Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#EADBCE]">
                <h3 className="text-base font-black text-[#381E0D]">Active Time Off Requests</h3>
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="px-3 py-1.5 bg-[#8C532B] hover:bg-[#7B3F1B] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Request</span>
                </button>
              </div>

              <div className="divide-y divide-[#EADBCE]/60 mt-2">
                {requests.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-[#381E0D]">{r.employee_name}</p>
                      <p className="text-[11px] text-[#735338] mt-0.5">
                        {r.time_off_type_name} &bull; {r.start_date} to {r.end_date} ({r.duration})
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          r.status === 'Approved'
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : r.status === 'Refused'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                        }`}
                      >
                        {r.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedRequest(r);
                          setActiveTab('requests');
                        }}
                        className="text-xs font-bold text-[#8C532B] hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Notes / Wireframe Summary Card */}
            <div className="bg-[#FAF7F2] rounded-3xl border border-[#EADBCE] p-6 space-y-4">
              <h3 className="text-sm font-black text-[#381E0D] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#8C532B]" />
                Policy &amp; Balance Rules
              </h3>
              <ul className="text-xs text-[#6E492B] space-y-2.5 leading-relaxed font-medium">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C532B] mt-1.5 shrink-0" />
                  <span><strong>Simple Approval Flow:</strong> Requests support 1-click Approve and Refuse controls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C532B] mt-1.5 shrink-0" />
                  <span><strong>Automatic Deduction:</strong> Approved leave instantly reduces employee available allocation balance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8C532B] mt-1.5 shrink-0" />
                  <span><strong>Custom Behavior:</strong> Time Off Types define whether prior allocation is mandatory before requesting.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: TIME OFF REQUESTS (SCREEN 1 & SCREEN 2)                             */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <>
          {/* SCREEN 1: LIST VIEW */}
          {!selectedRequest ? (
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <h2 className="text-lg font-black text-[#381E0D]">Time Off Requests</h2>
                  <p className="text-xs text-[#735338]">List view opened from Time Off ▼ &gt; Requests</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowNewRequestModal(true)}
                    className="px-4 py-2 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>NEW</span>
                  </button>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="h-3.5 w-3.5 text-[#8C532B]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-[#381E0D] placeholder-[#A38A73] focus:outline-none focus:border-[#8C532B]"
                    />
                  </div>

                  <button
                    onClick={() => setRequestFilter(requestFilter === 'all' ? 'my' : 'all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      requestFilter === 'my'
                        ? 'bg-[#FAF2E8] border-[#E8D5C0] text-[#78350F]'
                        : 'bg-white border-[#EADBCE] text-[#735338]'
                    }`}
                  >
                    My Time
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#6E492B] border-b border-[#EADBCE] font-bold">
                      <th className="py-3 px-4 rounded-l-xl">Employee</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Start</th>
                      <th className="py-3 px-4">End</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/50">
                    {filteredRequests.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-[#FAF7F2]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedRequest(r)}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#381E0D]">{r.employee_name}</td>
                        <td className="py-3.5 px-4 text-[#735338]">{r.time_off_type_name}</td>
                        <td className="py-3.5 px-4 text-[#735338]">{r.start_date}</td>
                        <td className="py-3.5 px-4 text-[#735338]">{r.end_date}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#381E0D]">{r.duration}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              r.status === 'Approved'
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                                : r.status === 'Refused'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(r);
                            }}
                            className="text-xs font-bold text-[#8C532B] hover:underline cursor-pointer"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#735338] italic">Useful note: request status should show the approval lifecycle clearly.</p>
            </div>
          ) : (
            /* SCREEN 2: FORM VIEW */
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8C532B] hover:underline mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Requests List
                  </button>
                  <h2 className="text-xl font-black text-[#381E0D]">
                    Time Off Request / {selectedRequest.employee_name}
                  </h2>
                  <p className="text-xs text-[#735338]">Form view of one request</p>
                </div>

                {/* Approve / Refuse Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    disabled={selectedRequest.status === 'Approved'}
                    className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRefuseRequest(selectedRequest.id)}
                    disabled={selectedRequest.status === 'Refused'}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Refuse</span>
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF7F2] p-6 rounded-2xl border border-[#EADBCE]">
                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Employee</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.employee_name}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Duration</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.duration}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Time Off Type</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.time_off_type_name}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Status</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.status}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Start Date</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.start_date}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Approver</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.approver}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">End Date</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.end_date}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Allocation Used</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRequest.allocation_used}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Reason</label>
                  <textarea
                    disabled
                    value={selectedRequest.reason}
                    rows={2}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl p-3 text-xs text-[#381E0D] font-medium"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#735338] italic">
                Useful note: if the selected type requires allocation, the request should clearly show which balance was consumed.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALLOCATIONS (SCREEN 3 & SCREEN 4)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'allocations' && (
        <>
          {/* SCREEN 3: LIST VIEW */}
          {!selectedAllocation ? (
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <h2 className="text-lg font-black text-[#381E0D]">Allocations</h2>
                  <p className="text-xs text-[#735338]">List view opened from Time Off ▼ &gt; Allocations</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowNewAllocModal(true)}
                    className="px-4 py-2 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>NEW</span>
                  </button>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="h-3.5 w-3.5 text-[#8C532B]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search allocations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-[#381E0D] placeholder-[#A38A73] focus:outline-none focus:border-[#8C532B]"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#6E492B] border-b border-[#EADBCE] font-bold">
                      <th className="py-3 px-4 rounded-l-xl">Employee</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Allocated</th>
                      <th className="py-3 px-4">Taken</th>
                      <th className="py-3 px-4">Remaining</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/50">
                    {filteredAllocations.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-[#FAF7F2]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedAllocation(a)}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#381E0D]">{a.employee_name}</td>
                        <td className="py-3.5 px-4 text-[#735338]">{a.time_off_type_name}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#381E0D]">{a.allocated_days} days</td>
                        <td className="py-3.5 px-4 text-[#735338]">{a.taken_days} days</td>
                        <td className="py-3.5 px-4 font-bold text-[#8C532B]">{a.remaining_days} days</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              a.status === 'Approved'
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAllocation(a);
                            }}
                            className="text-xs font-bold text-[#8C532B] hover:underline cursor-pointer"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#735338] italic">Useful note: the list should expose the balance with at a glance — Allocated, Taken, and Remaining.</p>
            </div>
          ) : (
            /* SCREEN 4: FORM VIEW */
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <button
                    onClick={() => setSelectedAllocation(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8C532B] hover:underline mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Allocations List
                  </button>
                  <h2 className="text-xl font-black text-[#381E0D]">
                    Allocation / {selectedAllocation.employee_name}
                  </h2>
                  <p className="text-xs text-[#735338]">Form view of one allocation record</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveAllocation(selectedAllocation.id)}
                    disabled={selectedAllocation.status === 'Approved'}
                    className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRefuseAllocation(selectedAllocation.id)}
                    disabled={selectedAllocation.status === 'Refused'}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Refuse</span>
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF7F2] p-6 rounded-2xl border border-[#EADBCE]">
                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Employee</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAllocation.employee_name}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Taken</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAllocation.taken_days} Days`}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Time Off Type</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAllocation.time_off_type_name}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Remaining</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAllocation.remaining_days} Days`}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#8C532B] font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Allocated</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAllocation.allocated_days} Days`}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Approver</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAllocation.approver}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Status</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAllocation.status}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Validity</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAllocation.validity}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Description</label>
                  <textarea
                    disabled
                    value={selectedAllocation.description}
                    rows={2}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl p-3 text-xs text-[#381E0D] font-medium"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#735338] italic">
                Useful note: approved allocation is what creates available leave balance for the employee.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TIME OFF TYPES (SCREEN 5 & SCREEN 6)                                */}
      {/* ========================================================================= */}
      {activeTab === 'types' && (
        <>
          {/* SCREEN 5: LIST VIEW */}
          {!selectedType ? (
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <h2 className="text-lg font-black text-[#381E0D]">Time Off Types</h2>
                  <p className="text-xs text-[#735338]">List view opened from Time Off ▼ &gt; Time Off Types</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowNewTypeModal(true)}
                    className="px-4 py-2 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>NEW</span>
                  </button>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="h-3.5 w-3.5 text-[#8C532B]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search time off types..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-[#381E0D] placeholder-[#A38A73] focus:outline-none focus:border-[#8C532B]"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#6E492B] border-b border-[#EADBCE] font-bold">
                      <th className="py-3 px-4 rounded-l-xl">Type Name</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Allocation</th>
                      <th className="py-3 px-4">Approval</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/50">
                    {filteredTypes.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-[#FAF7F2]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedType(t)}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#381E0D] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#8C532B]" />
                          <span>{t.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#735338]">{t.unit}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.requires_allocation === 'Yes'
                                ? 'bg-[#FAF2E8] text-[#78350F] border border-[#E8D5C0]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.requires_allocation === 'Yes' ? 'Required' : 'No'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#735338] font-medium">{t.approval}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                            {t.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedType(t);
                            }}
                            className="text-xs font-bold text-[#8C532B] hover:underline cursor-pointer"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#735338] italic">Useful note: this list defines policy rules, not employee transactions.</p>
            </div>
          ) : (
            /* SCREEN 6: FORM VIEW */
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE]">
                <div>
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setIsEditingType(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8C532B] hover:underline mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Types List
                  </button>
                  <h2 className="text-xl font-black text-[#381E0D]">
                    Time Off Type / {selectedType.name}
                  </h2>
                  <p className="text-xs text-[#735338]">Form view of one time off type</p>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingType ? (
                    <button
                      onClick={() => setIsEditingType(true)}
                      className="px-4 py-2 rounded-xl bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>EDIT</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveTypeEdit}
                      className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF7F2] p-6 rounded-2xl border border-[#EADBCE]">
                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Type Name</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.name}
                    onChange={(e) => setSelectedType({ ...selectedType, name: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Approval</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.approval}
                    onChange={(e) => setSelectedType({ ...selectedType, approval: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Unit</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.unit}
                    onChange={(e) => setSelectedType({ ...selectedType, unit: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Payroll / Work Entry</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.payroll_work_entry}
                    onChange={(e) => setSelectedType({ ...selectedType, payroll_work_entry: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Requires Allocation</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.requires_allocation}
                    onChange={(e) => setSelectedType({ ...selectedType, requires_allocation: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Display Color</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.display_color}
                    onChange={(e) => setSelectedType({ ...selectedType, display_color: e.target.value })}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Active</label>
                  <input
                    type="text"
                    disabled={!isEditingType}
                    value={selectedType.active ? 'True' : 'False'}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#381E0D] font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">Configuration Notes</label>
                  <textarea
                    disabled={!isEditingType}
                    value={selectedType.config_notes}
                    onChange={(e) => setSelectedType({ ...selectedType, config_notes: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-[#EADBCE] rounded-xl p-3 text-xs text-[#381E0D] font-medium"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#735338] italic">
                Useful note: Time Off Type drives approval behavior and whether a request needs an allocation.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW TIME OFF REQUEST                                               */}
      {/* ========================================================================= */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-[#381E0D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EADBCE] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
              <h3 className="text-base font-bold text-[#381E0D]">New Time Off Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-[#8C532B]/60 hover:text-[#8C532B] p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Employee</label>
                <input
                  type="text"
                  value={newReq.employee_name}
                  onChange={(e) => setNewReq({ ...newReq, employee_name: e.target.value })}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Time Off Type</label>
                <select
                  value={newReq.time_off_type_name}
                  onChange={(e) => setNewReq({ ...newReq, time_off_type_name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium cursor-pointer"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newReq.start_date}
                    onChange={(e) => setNewReq({ ...newReq, start_date: e.target.value })}
                    required
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">End Date</label>
                  <input
                    type="date"
                    value={newReq.end_date}
                    onChange={(e) => setNewReq({ ...newReq, end_date: e.target.value })}
                    required
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newReq.days_count}
                  onChange={(e) => setNewReq({ ...newReq, days_count: Number(e.target.value) })}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Reason</label>
                <textarea
                  value={newReq.reason}
                  onChange={(e) => setNewReq({ ...newReq, reason: e.target.value })}
                  rows={2}
                  placeholder="e.g. Vacation, medical checkup"
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW ALLOCATION                                                     */}
      {/* ========================================================================= */}
      {showNewAllocModal && (
        <div className="fixed inset-0 z-50 bg-[#381E0D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EADBCE] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
              <h3 className="text-base font-bold text-[#381E0D]">New Leave Allocation</h3>
              <button
                onClick={() => setShowNewAllocModal(false)}
                className="text-[#8C532B]/60 hover:text-[#8C532B] p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Employee</label>
                <input
                  type="text"
                  value={newAlloc.employee_name}
                  onChange={(e) => setNewAlloc({ ...newAlloc, employee_name: e.target.value })}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Time Off Type</label>
                <select
                  value={newAlloc.time_off_type_name}
                  onChange={(e) => setNewAlloc({ ...newAlloc, time_off_type_name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium cursor-pointer"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Allocated Days</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newAlloc.allocated_days}
                  onChange={(e) => setNewAlloc({ ...newAlloc, allocated_days: Number(e.target.value) })}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Validity</label>
                <input
                  type="text"
                  value={newAlloc.validity}
                  onChange={(e) => setNewAlloc({ ...newAlloc, validity: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Description</label>
                <textarea
                  value={newAlloc.description}
                  onChange={(e) => setNewAlloc({ ...newAlloc, description: e.target.value })}
                  rows={2}
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Create Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW TIME OFF TYPE                                                  */}
      {/* ========================================================================= */}
      {showNewTypeModal && (
        <div className="fixed inset-0 z-50 bg-[#381E0D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EADBCE] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
              <h3 className="text-base font-bold text-[#381E0D]">Create Time Off Type</h3>
              <button
                onClick={() => setShowNewTypeModal(false)}
                className="text-[#8C532B]/60 hover:text-[#8C532B] p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTypeSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Type Name</label>
                <input
                  type="text"
                  placeholder="e.g. Parental Leave"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="PARENT"
                    value={newType.code}
                    onChange={(e) => setNewType({ ...newType, code: e.target.value })}
                    required
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Unit</label>
                  <select
                    value={newType.unit}
                    onChange={(e) => setNewType({ ...newType, unit: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium cursor-pointer"
                  >
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Requires Allocation</label>
                  <select
                    value={newType.requires_allocation}
                    onChange={(e) => setNewType({ ...newType, requires_allocation: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Approval</label>
                  <select
                    value={newType.approval}
                    onChange={(e) => setNewType({ ...newType, approval: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2 text-[#381E0D] font-medium cursor-pointer"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Officer">Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A2810] mb-1">Configuration Notes</label>
                <textarea
                  value={newType.config_notes}
                  onChange={(e) => setNewType({ ...newType, config_notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl p-2.5 text-[#381E0D] font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Create Time Off Type
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
