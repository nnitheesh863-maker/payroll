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
  DollarSign,
  Calculator,
  Receipt,
  ArrowRight,
  HelpCircle,
  Activity,
  FileText,
  SlidersHorizontal,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  timeOffApi,
  TimeOffTypeItem,
  AllocationItem,
  TimeOffRequestItem,
} from '../../services/timeoff.api';
import { useAuth } from '../../hooks/useAuth';

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();
  const isHRorAdmin = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR_PAYROLL_MANAGER';

  // Navigation tabs: 'dashboard' | 'requests' | 'types' | 'allocations' | 'pipeline'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'types' | 'allocations' | 'pipeline'>('dashboard');

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

  // 🧪 Interactive Simulator State (Real-world Nitheesh Scenario)
  const [simEmployee, setSimEmployee] = useState('Nitheesh');
  const [simSalary, setSimSalary] = useState<number>(30000);
  const [simLeaveType, setSimLeaveType] = useState('Casual Leave');
  const [simLeaveDays, setSimLeaveDays] = useState<number>(3);
  const [simAllocatedDays, setSimAllocatedDays] = useState<number>(12);
  const [simUsedDays, setSimUsedDays] = useState<number>(0);
  const [simActiveStep, setSimActiveStep] = useState<number>(1);
  const [simIsApproved, setSimIsApproved] = useState<boolean>(false);

  // New Request Form
  const [newReq, setNewReq] = useState({
    employee_name: 'Nitheesh',
    time_off_type_name: 'Casual Leave',
    start_date: '2026-09-10',
    end_date: '2026-09-12',
    days_count: 3,
    reason: 'Personal work',
  });

  // New Allocation Form
  const [newAlloc, setNewAlloc] = useState({
    employee_name: 'Nitheesh',
    time_off_type_name: 'Casual Leave',
    allocated_days: 12,
    validity: '2026 Annual Quota',
    description: 'Annual Casual Leave quota (12 days)',
  });

  // New Type Form
  const [newType, setNewType] = useState({
    name: 'Casual Leave',
    code: 'CASUAL',
    unit: 'Days',
    requires_allocation: 'Yes',
    approval: 'Manager',
    payroll_work_entry: 'Paid Leave (100% Salary)',
    display_color: 'Amber',
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

  // Real-time dynamic statistics computed from live allocations and requests state
  const ptoAllocs = allocations.filter(
    (a) =>
      a.time_off_type_name.toLowerCase().includes('paid') ||
      a.time_off_type_name.toLowerCase().includes('pto') ||
      a.time_off_type_name.toLowerCase().includes('casual')
  );
  const ptoRemaining = ptoAllocs.length > 0 
    ? ptoAllocs.reduce((acc, a) => acc + (Number(a.remaining_days) || 0), 0)
    : 12;
  const ptoAllocated = ptoAllocs.length > 0 
    ? ptoAllocs.reduce((acc, a) => acc + (Number(a.allocated_days) || 0), 0)
    : 20;
  const ptoPercent = ptoAllocated > 0 ? Math.min(100, Math.max(5, Math.round((ptoRemaining / ptoAllocated) * 100))) : 60;

  const sickAllocs = allocations.filter((a) =>
    a.time_off_type_name.toLowerCase().includes('sick')
  );
  const sickRemaining = sickAllocs.length > 0
    ? sickAllocs.reduce((acc, a) => acc + (Number(a.remaining_days) || 0), 0)
    : 8;
  const sickAllocated = sickAllocs.length > 0
    ? sickAllocs.reduce((acc, a) => acc + (Number(a.allocated_days) || 0), 0)
    : 10;
  const sickPercent = sickAllocated > 0 ? Math.min(100, Math.max(5, Math.round((sickRemaining / sickAllocated) * 100))) : 80;

  const compAllocs = allocations.filter(
    (a) =>
      a.time_off_type_name.toLowerCase().includes('comp') ||
      a.time_off_type_name.toLowerCase().includes('compensatory')
  );
  const compRemaining = compAllocs.length > 0
    ? compAllocs.reduce((acc, a) => acc + (Number(a.remaining_days) || 0), 0)
    : 1;
  const compAllocated = compAllocs.length > 0
    ? compAllocs.reduce((acc, a) => acc + (Number(a.allocated_days) || 0), 0)
    : 2;
  const compPercent = compAllocated > 0 ? Math.min(100, Math.max(5, Math.round((compRemaining / compAllocated) * 100))) : 50;

  const pendingRequestsCount = requests.filter(
    (r) => r.status === 'To Approve'
  ).length;
  const pendingAllocationsCount = allocations.filter(
    (a) => a.status === 'To Approve'
  ).length;
  const totalPendingReviews = pendingRequestsCount + pendingAllocationsCount;

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

        {/* 5 Unified Sub-tabs (Dashboard, Time Offs, Allocations, Time Off Types, Leave->Payroll Flow) */}
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
          <button
            onClick={() => {
              setActiveTab('pipeline');
              setSelectedRequest(null);
              setSelectedAllocation(null);
              setSelectedType(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#B87B4C] text-white shadow-md shadow-[#8C532B]/30'
                : 'text-[#8C532B] hover:text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Leave &rarr; Attendance &rarr; Payroll Flow</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: TIME OFF DASHBOARD VIEW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* 🌟 Interactive Real-World Flow Banner (Nitheesh Example) */}
          <div className="bg-gradient-to-r from-[#FAF2E8] via-[#FAF7F2] to-white rounded-3xl border-2 border-[#E8D5C0] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8C532B] bg-[#FAF2E8] border border-[#E8D5C0] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3 text-[#8C532B]" /> Real-World Integration Engine
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                  Live Attendance + LOP Sync
                </span>
              </div>
              <h2 className="text-base font-black text-[#381E0D]">
                Employee Leave &rarr; Manager Approval &rarr; Quota Deduction &rarr; Attendance &rarr; Payroll LOP
              </h2>
              <p className="text-xs text-[#735338] max-w-2xl leading-relaxed">
                Demonstrating <strong>Nitheesh</strong> (Casual Leave Quota: 12 Days | ₹30,000/mo Salary) applying for 3 Days leave (Sep 10–12).
                See how Manager approval automatically consumes allocation balance, marks attendance, and calculates paid vs unpaid LOP deductions.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('pipeline')}
              className="px-5 py-2.5 bg-gradient-to-r from-[#8C532B] to-[#A06439] hover:from-[#78350F] hover:to-[#8C532B] text-white font-bold text-xs rounded-2xl shadow-md shadow-[#8C532B]/30 flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Live Simulator &rarr;</span>
            </button>
          </div>

          {/* Top Metric Cards (Live Real-Time Data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs relative overflow-hidden group hover:border-[#8C532B]/50 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Paid Time Off (PTO)</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Live Quota</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#381E0D]">{ptoRemaining}</span>
                <span className="text-xs text-[#735338] font-bold">/ {ptoAllocated} days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div 
                  className="bg-gradient-to-r from-[#8C532B] to-[#A06439] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${ptoPercent}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#A38A73] mt-2 font-medium">
                {Math.max(0, ptoAllocated - ptoRemaining)} days used &bull; {ptoAllocs.length} allocations active
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs relative overflow-hidden group hover:border-[#8C532B]/50 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Sick Leave</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Statutory</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#8C532B]">{sickRemaining}</span>
                <span className="text-xs text-[#735338] font-bold">/ {sickAllocated} days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div 
                  className="bg-gradient-to-r from-[#9E6237] to-[#B87B4C] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${sickPercent}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#A38A73] mt-2 font-medium">
                {Math.max(0, sickAllocated - sickRemaining)} days utilized &bull; {sickAllocs.length} policies active
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs relative overflow-hidden group hover:border-[#8C532B]/50 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Comp Off Quota</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Earned</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#78350F]">{compRemaining}</span>
                <span className="text-xs text-[#735338] font-bold">/ {compAllocated} days remaining</span>
              </div>
              <div className="mt-3 w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#EADBCE]">
                <div 
                  className="bg-gradient-to-r from-[#B45309] to-[#D97706] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${compPercent}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#A38A73] mt-2 font-medium">
                {Math.max(0, compAllocated - compRemaining)} days redeemed &bull; {compAllocs.length} records
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs relative overflow-hidden group hover:border-[#8C532B]/50 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Approval Queue</p>
                {totalPendingReviews > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    Action Required
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#B45309]">
                  {pendingRequestsCount}
                </span>
                <span className="text-xs text-[#735338] font-bold">Pending HR Manager Review</span>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="mt-3 text-xs font-bold text-[#8C532B] hover:text-[#78350F] flex items-center gap-1 cursor-pointer transition-colors group-hover:underline"
              >
                Review Requests ({pendingRequestsCount} pending) <ChevronRight className="h-3 w-3" />
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
                  {isHRorAdmin ? (
                    <>
                      <button
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        disabled={selectedRequest.status === 'Approved'}
                        className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                        title="Authorize and approve this leave request as HR Manager"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve (HR Manager)</span>
                      </button>
                      <button
                        onClick={() => handleRefuseRequest(selectedRequest.id)}
                        disabled={selectedRequest.status === 'Refused'}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                        title="Refuse this leave request"
                      >
                        <X className="h-4 w-4" />
                        <span>Refuse</span>
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-[#FAF2E8] border border-[#E8D5C0] text-[#78350F] font-semibold text-xs flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-[#8C532B]" />
                      <span>Details View Only &bull; Approval by HR Manager Only</span>
                    </div>
                  )}
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
      {/* TAB 4: LEAVE -> ATTENDANCE -> PAYROLL PIPELINE & SIMULATOR                */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#B87B4C] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Full-Stack HR + Payroll Integration Engine
                </span>
                <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 px-3 py-1 rounded-full">
                  Statutory &amp; LOP Compliant
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Leave &rarr; Attendance &rarr; Payroll Integration Lifecycle
              </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-3xl leading-relaxed">
                When an employee applies for leave, the manager approval automatically updates their leave quota, 
                marks the attendance records, and determines whether full salary is paid or Loss of Pay (LOP) deduction is calculated in Payroll.
              </p>
            </div>
          </div>

          {/* SECTION 1: Real-World Nitheesh Scenario Interactive Showcase */}
          <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADBCE] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8C532B] animate-pulse" />
                  <h3 className="text-lg font-black text-[#381E0D]">
                    Real-World Example Walkthrough: Nitheesh's Leave
                  </h3>
                </div>
                <p className="text-xs text-[#735338] font-medium">
                  Watch the complete 4-stage lifecycle from initial application to salary disbursement.
                </p>
              </div>

              {/* Scenario Switcher Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setSimLeaveType('Casual Leave');
                    setSimLeaveDays(3);
                    setSimSalary(30000);
                    setSimAllocatedDays(12);
                    setSimUsedDays(0);
                    setSimIsApproved(true);
                    setSimActiveStep(4);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simLeaveType === 'Casual Leave' && simIsApproved
                      ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] shadow-xs'
                      : 'bg-[#FAF7F2] text-[#735338] border-[#EADBCE] hover:bg-white'
                  }`}
                >
                  Scenario A: Paid Leave (₹30k)
                </button>
                <button
                  onClick={() => {
                    setSimLeaveType('Unpaid Leave (LOP)');
                    setSimLeaveDays(3);
                    setSimSalary(30000);
                    setSimAllocatedDays(12);
                    setSimUsedDays(0);
                    setSimIsApproved(true);
                    setSimActiveStep(4);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simLeaveType.includes('Unpaid') && simIsApproved
                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                      : 'bg-[#FAF7F2] text-[#735338] border-[#EADBCE] hover:bg-white'
                  }`}
                >
                  Scenario B: Unpaid LOP (₹27k)
                </button>
                <button
                  onClick={() => {
                    setSimIsApproved(false);
                    setSimActiveStep(1);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-[#735338] hover:text-[#381E0D] bg-white border border-[#EADBCE] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Profile Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADBCE]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A38A73]">Employee</p>
                <p className="text-xs font-black text-[#381E0D] mt-0.5">Nitheesh (EMP-011)</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A38A73]">Monthly Salary</p>
                <p className="text-xs font-black text-[#15803D] mt-0.5">₹30,000 / month (₹1,000/day)</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A38A73]">Leave Type &amp; Dates</p>
                <p className="text-xs font-black text-[#8C532B] mt-0.5">{simLeaveType} &bull; Sep 10 &ndash; Sep 12</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A38A73]">Requested Duration</p>
                <p className="text-xs font-black text-[#78350F] mt-0.5">3 Full Calendar Days</p>
              </div>
            </div>

            {/* Step-by-Step 4-Card Visual Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* STEP 1: Apply Leave */}
              <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                simActiveStep >= 1 ? 'bg-white border-[#8C532B]/60 shadow-xs' : 'bg-[#FAF7F2]/60 border-[#EADBCE]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF2E8] text-[#78350F] border border-[#E8D5C0]">
                      Step 1
                    </span>
                    <Clock className="h-4 w-4 text-[#8C532B]" />
                  </div>
                  <h4 className="text-xs font-black text-[#381E0D]">1. Leave Application</h4>
                  <p className="text-[11px] text-[#735338] mt-1 leading-relaxed">
                    Nitheesh requests 3 days for <em>"Personal work"</em> from Sep 10 to Sep 12.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EADBCE]/80 text-[11px] space-y-1 font-mono">
                  <p className="text-[#381E0D]">Quota: <span className="font-bold">12 Days</span></p>
                  <p className="text-[#8C532B]">Status: <span className="font-bold">{simIsApproved ? 'Approved' : 'Pending'}</span></p>
                </div>
              </div>

              {/* STEP 2: HR Manager Approval (Manager Details Review) */}
              <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                simActiveStep >= 2 ? 'bg-white border-[#8C532B]/60 shadow-xs' : 'bg-[#FAF7F2]/60 border-[#EADBCE]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF2E8] text-[#78350F] border border-[#E8D5C0]">
                      Step 2
                    </span>
                    <ShieldCheck className="h-4 w-4 text-[#8C532B]" />
                  </div>
                  <h4 className="text-xs font-black text-[#381E0D]">2. HR Manager Approval</h4>
                  <p className="text-[11px] text-[#735338] mt-1 leading-relaxed">
                    Team Manager reviews the request details only. Final sign-off is authorized &amp; approved by <strong>HR Manager</strong> only.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EADBCE]/80 space-y-2">
                  <div className="p-2 rounded-xl bg-[#FAF2E8]/80 border border-[#E8D5C0] text-[10px] space-y-0.5 font-medium text-[#735338]">
                    <div className="flex justify-between">
                      <span>Manager Role:</span>
                      <span className="font-bold text-[#381E0D]">Details Review Only</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sign-off:</span>
                      <span className="font-bold text-[#8C532B]">HR Manager Only</span>
                    </div>
                  </div>
                  {!simIsApproved ? (
                    <button
                      onClick={() => {
                        setSimIsApproved(true);
                        setSimActiveStep(4);
                      }}
                      className="w-full bg-[#8C532B] hover:bg-[#78350F] text-white text-xs font-bold py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve as HR Manager
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approved by HR Manager</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: Quota & Attendance Sync */}
              <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                simActiveStep >= 3 ? 'bg-white border-[#8C532B]/60 shadow-xs' : 'bg-[#FAF7F2]/60 border-[#EADBCE]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF2E8] text-[#78350F] border border-[#E8D5C0]">
                      Step 3
                    </span>
                    <UserCheck className="h-4 w-4 text-[#8C532B]" />
                  </div>
                  <h4 className="text-xs font-black text-[#381E0D]">3. Quota &amp; Attendance</h4>
                  <p className="text-[11px] text-[#735338] mt-1 leading-relaxed">
                    Leave balance auto-deducts. Attendance logs Sep 10&ndash;12 as <strong>ON_LEAVE</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EADBCE]/80 text-[11px] space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Allocated:</span>
                    <span className="font-bold text-slate-800">12 days</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Used:</span>
                    <span className="font-bold text-amber-700">{simIsApproved && !simLeaveType.includes('Unpaid') ? '3 days' : '0 days'}</span>
                  </div>
                  <div className="flex justify-between font-mono font-bold text-emerald-700">
                    <span>Remaining:</span>
                    <span>{simIsApproved && !simLeaveType.includes('Unpaid') ? '9 days' : '12 days'}</span>
                  </div>
                </div>
              </div>

              {/* STEP 4: Payroll & LOP Engine */}
              <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                simActiveStep >= 4 ? 'bg-gradient-to-b from-[#FAF7F2] to-white border-[#8C532B] shadow-md' : 'bg-[#FAF7F2]/60 border-[#EADBCE]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                      Step 4: Payroll
                    </span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-black text-[#381E0D]">4. Payroll &amp; LOP Impact</h4>
                  <p className="text-[11px] text-[#735338] mt-1 leading-relaxed">
                    {!simLeaveType.includes('Unpaid')
                      ? 'Paid leave = 100% full salary disbursed with ₹0 deduction.'
                      : 'Unpaid leave = LOP deducted (3 days × ₹1,000 = ₹3,000).'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EADBCE]/80">
                  <div className="p-2.5 rounded-2xl bg-[#FAF2E8] border border-[#E8D5C0] space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-[#735338]">
                      <span>Gross Salary:</span>
                      <span>₹30,000</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-rose-700">
                      <span>LOP Deduction:</span>
                      <span>{simLeaveType.includes('Unpaid') ? '- ₹3,000' : '₹0 (Paid)'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-[#381E0D] pt-1 border-t border-[#E8D5C0]">
                      <span>Net Salary:</span>
                      <span className="text-emerald-700">{simLeaveType.includes('Unpaid') ? '₹27,000' : '₹30,000'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: Dynamic Live Sandbox & Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Controls */}
            <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#EADBCE]">
                <Calculator className="h-5 w-5 text-[#8C532B]" />
                <div>
                  <h3 className="text-sm font-black text-[#381E0D]">Live Payroll &amp; LOP Sandbox</h3>
                  <p className="text-[11px] text-[#735338]">Adjust variables to calculate any custom scenario</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={simEmployee}
                    onChange={(e) => setSimEmployee(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-2 text-[#381E0D] font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-[#4A2810] mb-1">
                    <span>Monthly Salary</span>
                    <span className="text-emerald-700 font-mono">₹{simSalary.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="150000"
                    step="5000"
                    value={simSalary}
                    onChange={(e) => setSimSalary(Number(e.target.value))}
                    className="w-full accent-[#8C532B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>₹15k</span>
                    <span>Daily: ₹{(simSalary / 30).toFixed(0)}/day</span>
                    <span>₹1.5L</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#4A2810] mb-1">Time Off Type</label>
                  <select
                    value={simLeaveType}
                    onChange={(e) => setSimLeaveType(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-2 text-[#381E0D] font-bold cursor-pointer"
                  >
                    <option value="Casual Leave">Casual Leave (Paid Quota)</option>
                    <option value="Sick Leave">Sick Leave (Paid Quota)</option>
                    <option value="Paid Time Off">Paid Time Off (PTO)</option>
                    <option value="Unpaid Leave (LOP)">Unpaid Leave / LOP (Salary Deducted)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#4A2810] mb-1">Leave Days</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={simLeaveDays}
                      onChange={(e) => setSimLeaveDays(Number(e.target.value))}
                      className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-2 text-[#381E0D] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A2810] mb-1">Quota Allocated</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={simAllocatedDays}
                      onChange={(e) => setSimAllocatedDays(Number(e.target.value))}
                      className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-2 text-[#381E0D] font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Calculated Payrun & Slip Output */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#8C532B]" />
                  <h3 className="text-sm font-black text-[#381E0D]">Live Computed Payroll Breakdown</h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  !simLeaveType.includes('Unpaid')
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {!simLeaveType.includes('Unpaid') ? 'Paid Leave Entry' : 'Loss of Pay (LOP) Rule Triggered'}
                </span>
              </div>

              {/* Calculation Formula Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE]">
                  <p className="text-[10px] font-bold text-[#735338] uppercase">Daily Salary Rate</p>
                  <p className="text-base font-black text-[#381E0D] mt-1">₹{(simSalary / 30).toFixed(2)}</p>
                  <p className="text-[10px] text-[#A38A73] mt-0.5">₹{simSalary.toLocaleString()} &divide; 30 days</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE]">
                  <p className="text-[10px] font-bold text-[#735338] uppercase">Leave Quota Balance</p>
                  <p className="text-base font-black text-[#8C532B] mt-1">
                    {!simLeaveType.includes('Unpaid')
                      ? `${Math.max(0, simAllocatedDays - simLeaveDays)} / ${simAllocatedDays} days`
                      : `${simAllocatedDays} / ${simAllocatedDays} days (Unchanged)`}
                  </p>
                  <p className="text-[10px] text-[#A38A73] mt-0.5">
                    {!simLeaveType.includes('Unpaid') ? `Used ${simLeaveDays} days from allocation` : 'Unpaid skips allocation'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE]">
                  <p className="text-[10px] font-bold text-[#735338] uppercase">LOP Deduction Amount</p>
                  <p className="text-base font-black text-rose-700 mt-1">
                    {simLeaveType.includes('Unpaid')
                      ? `₹${((simSalary / 30) * simLeaveDays).toFixed(2)}`
                      : '₹0.00 (No deduction)'}
                  </p>
                  <p className="text-[10px] text-[#A38A73] mt-0.5">
                    {simLeaveType.includes('Unpaid') ? `${simLeaveDays} days &times; daily rate` : 'Paid statutory entitlement'}
                  </p>
                </div>
              </div>

              {/* Payslip Line Items Table Simulation */}
              <div className="border border-[#EADBCE] rounded-2xl overflow-hidden text-xs">
                <div className="bg-[#FAF7F2] px-4 py-2 font-bold text-[#381E0D] flex justify-between border-b border-[#EADBCE]">
                  <span>Component / Salary Rule</span>
                  <span>Amount</span>
                </div>
                <div className="p-3.5 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>Basic &amp; Earnings (Contract Wage):</span>
                    <span>+ ₹{simSalary.toFixed(2)}</span>
                  </div>
                  {simLeaveType.includes('Unpaid') && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Loss of Pay (LOP) &bull; {simLeaveDays} Days Unpaid:</span>
                      <span>- ₹{((simSalary / 30) * simLeaveDays).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>PF &amp; Statutory Deductions (Est.):</span>
                    <span>- ₹{(simSalary * 0.06).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#381E0D] pt-2 border-t border-[#EADBCE] font-sans">
                    <span>Net Disbursed Take-Home Salary:</span>
                    <span className="text-emerald-700">
                      ₹{(
                        simSalary -
                        (simLeaveType.includes('Unpaid') ? (simSalary / 30) * simLeaveDays : 0) -
                        simSalary * 0.06
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* SECTION 3: 14 Key Concepts for Evaluators / Judge Presentation */}
          <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#EADBCE] pb-3">
              <h3 className="text-base font-black text-[#381E0D] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#8C532B]" />
                <span>14 Architectural Concepts: Time Off &amp; Payroll Explained</span>
              </h3>
              <p className="text-xs text-[#735338]">
                Comprehensive reference guide connecting every field from employee leave filing to bank disbursement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                { title: '1. Time Off & LeavesFlow', desc: 'Enterprise module governing requests, quotas, approval chains, and payroll work entries.' },
                { title: '2. Executive Dashboard', desc: 'Real-time KPIs showing Total Headcount, Pending Approvals, Staff on Leave, and Quotas.' },
                { title: '3. Time Offs (Requests)', desc: 'Individual employee requests storing dates, days count, reason, approver, and approval status.' },
                { title: '4. Allocations (Quotas)', desc: 'Annual or quarterly leave balances assigned to employees (e.g. 12 Casual Leaves per year).' },
                { title: '5. Time Off Types', desc: 'Configurable categories: Casual, Sick, PTO, Unpaid LOP, with allocation requirement flags.' },
                { title: '6. Employee Association', desc: 'Associates each request with a verified employee profile and employment contract.' },
                { title: '7. Duration Math', desc: 'Calculates inclusive calendar duration (e.g. Sep 10 to Sep 12 = 3 full days).' },
                { title: '8. Type Selection', desc: 'Determines whether the leave consumes paid allocation or triggers LOP salary deduction.' },
                { title: '9. Status Transitions', desc: 'Controlled lifecycle: Draft &rarr; Submitted &rarr; Approved / Refused &rarr; Cancelled.' },
                { title: '10 & 11. Start & End Dates', desc: 'Defines the exact date boundary passed to attendance and payroll calculation periods.' },
                { title: '12. Approver Chain', desc: 'Routes requests to designated Manager or HR Officer for signature and audit logs.' },
                { title: '13. Reason for Leave', desc: 'Provides compliance documentation (e.g. "Personal work", "Medical appointment").' },
                { title: '14. Allocation Used & Payroll LOP', desc: 'Automatically deducts consumed balance and feeds LOP deduction rules into payrun calculation.' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-[#381E0D]">{item.title}</h5>
                    <p className="text-[11px] text-[#735338] mt-1 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
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
