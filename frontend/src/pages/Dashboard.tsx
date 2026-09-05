import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  UserCheck,
  CalendarOff,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
  PlusCircle,
  CheckCircle2,
  Shield,
  Sparkles,
  Check,
  X,
  Layers,
  FileCheck,
  Building2,
  ChevronRight,
  Calendar,
  Activity,
  Briefcase,
  ArrowUpRight,
  Play,
  FileText,
  Calculator,
  Receipt,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { dashboardApi } from '../services/dashboard.api';
import { DashboardMetrics, Role } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const { user, quickLoginAsRole } = useAuth();
  const navigate = useNavigate();
  const {
    isEmployee,
    isHRManager,
    isPayrollUser,
    isPayrollManager,
    isAdmin,
    canCreatePayrun,
    canValidatePayrun,
    canApproveLeaves,
    canManageEmployees,
    canManageUsers,
  } = usePermission();

  const fetchDashboard = async () => {
    try {
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleRoleSwitch = async (role: Role) => {
    if (user?.role === role) return;
    setIsSwitchingRole(true);
    try {
      await quickLoginAsRole(role);
      await fetchDashboard();
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const roleConfigs: {
    role: Role;
    title: string;
    person: string;
    desc: string;
    color: string;
    activeBorder: string;
    badge: string;
    dotColor: string;
  }[] = [
    {
      role: 'ADMIN',
      title: 'Admin',
      person: 'System Administrator',
      desc: 'Universal control, security policies, full access',
      color: 'hover:border-[#E8D5C0] hover:bg-[#FAF2E8]/60',
      activeBorder: 'border-[#8C532B] bg-[#FAF2E8] ring-2 ring-[#8C532B]/30',
      badge: 'bg-[#8C532B] text-white',
      dotColor: 'bg-[#8C532B]',
    },
    {
      role: 'HR_MANAGER',
      title: 'HR Manager',
      person: 'Sara Khan',
      desc: 'Employees 360°, contracts, leave approvals',
      color: 'hover:border-[#E2CEB9] hover:bg-[#F7EFE4]/60',
      activeBorder: 'border-[#9E6237] bg-[#F7EFE4] ring-2 ring-[#9E6237]/30',
      badge: 'bg-[#9E6237] text-white',
      dotColor: 'bg-[#9E6237]',
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      title: 'Payroll Manager',
      person: 'Rajesh Sharma',
      desc: 'Validate payruns, disburse salaries, export PDFs',
      color: 'hover:border-[#DDD0C2] hover:bg-[#F3EFEA]/60',
      activeBorder: 'border-[#7B3F1B] bg-[#F3EFEA] ring-2 ring-[#7B3F1B]/30',
      badge: 'bg-[#7B3F1B] text-white',
      dotColor: 'bg-[#7B3F1B]',
    },
    {
      role: 'HR_PAYROLL_USER',
      title: 'Payroll Specialist',
      person: 'Priya Varma',
      desc: 'Salary structures, batch calculation engine',
      color: 'hover:border-[#EADCC9] hover:bg-[#FAF5EE]/60',
      activeBorder: 'border-[#B87B4C] bg-[#FAF5EE] ring-2 ring-[#B87B4C]/30',
      badge: 'bg-[#B87B4C] text-white',
      dotColor: 'bg-[#B87B4C]',
    },
    {
      role: 'EMPLOYEE',
      title: 'Employee',
      person: 'Aarav Mehta',
      desc: 'Self-service portal, clock-in, view payslips',
      color: 'hover:border-[#EADBCE] hover:bg-[#FDFBF7]',
      activeBorder: 'border-[#A87B56] bg-[#FDFBF7] ring-2 ring-[#A87B56]/30',
      badge: 'bg-[#A87B56] text-white',
      dotColor: 'bg-[#A87B56]',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner text="Loading PeoplePay360 dashboard..." />;
  }

  const kpis = metrics?.kpis;

  const statCards = [
    {
      title: 'Active Employees',
      value: kpis?.active_employees ?? 0,
      total: `${kpis?.total_employees ?? 0} on roll`,
      icon: Users,
      badge: '+2 this month',
      color: 'bg-[#FAF2E8] text-[#78350F] border-[#E8D5C0]',
      link: '/employees',
    },
    {
      title: 'Monthly Payroll',
      value: `₹${((kpis?.total_payroll_last_month ?? 0) / 100000).toFixed(2)}L`,
      total: 'Disbursed cycle',
      icon: DollarSign,
      badge: '100% compliant',
      color: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      link: '/payroll',
    },
    {
      title: 'Today Attendance',
      value: `${kpis?.today_present ?? 0}`,
      total: `${kpis?.today_late ?? 0} late, ${kpis?.today_on_leave ?? 0} on leave`,
      icon: UserCheck,
      badge: '44 / 46 present',
      color: 'bg-[#F7EFE4] text-[#8C532B] border-[#E2CEB9]',
      link: '/attendance',
    },
    {
      title: 'Pending Approvals',
      value: kpis?.pending_leave_requests ?? 0,
      total: `${kpis?.pending_payruns ?? 0} payrun in progress`,
      icon: CalendarOff,
      badge: 'Requires action',
      color: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      link: '/time-off',
    },
  ];

  return (
    <div className="space-y-6 antialiased font-sans text-slate-800 pb-8">
      
      {/* 🌟 Top Interactive RBAC Persona & Role Switcher Banner */}
      <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8C532B]" />
              <h2 className="text-base sm:text-lg font-black text-[#381E0D] tracking-tight">
                Role-Based Access Control (RBAC) Dashboard
              </h2>
              <span className="text-[10px] font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">
                Active Policy: Role-Specific
              </span>
            </div>
            <p className="text-xs text-[#735338] font-medium mt-1">
              Showing entities &amp; actions allowed for <span className="font-bold text-[#381E0D]">{user?.full_name}</span>. Click any role below to switch personas.
            </p>
          </div>
          {isSwitchingRole && (
            <span className="text-xs font-bold text-[#8C532B] flex items-center gap-1.5 animate-pulse self-start lg:self-auto">
              <span className="h-2 w-2 rounded-full bg-[#8C532B]" /> Switching Role Persona...
            </span>
          )}
        </div>

        {/* 5 Interactive Role Persona Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {roleConfigs.map((rc) => {
            const isActive = user?.role === rc.role;
            return (
              <button
                key={rc.role}
                onClick={() => handleRoleSwitch(rc.role)}
                disabled={isSwitchingRole}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? rc.activeBorder
                    : `bg-white border-[#EADBCE] ${rc.color} shadow-2xs hover:scale-[1.01]`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${rc.dotColor}`} />
                      <span className="font-bold text-xs text-[#381E0D]">{rc.title}</span>
                    </div>
                    {isActive ? (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${rc.badge}`}>
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8C532B]/60 font-semibold">Test</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#4A2810]">{rc.person}</p>
                  <p className="text-[11px] text-[#735338] mt-1 leading-snug line-clamp-2">
                    {rc.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#EADBCE]/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-[#8C532B]/60 font-bold">{rc.role}</span>
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Permissions Strip */}
        <div className="mt-4 pt-3 border-t border-[#EADBCE]/60 flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADBCE]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#8C532B] shrink-0" />
            <span className="font-bold text-[#381E0D]">
              Active Persona: <span className="text-[#8C532B]">{user?.full_name}</span> ({user?.role?.replace(/_/g, ' ')})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className={`inline-flex items-center gap-1 ${canManageEmployees ? 'text-[#15803D]' : 'text-slate-400 line-through'}`}>
              {canManageEmployees ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <X className="h-3.5 w-3.5 text-slate-400" />} Employee Hub
            </span>
            <span className={`inline-flex items-center gap-1 ${canApproveLeaves ? 'text-[#15803D]' : 'text-slate-400 line-through'}`}>
              {canApproveLeaves ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <X className="h-3.5 w-3.5 text-slate-400" />} Approve Leaves
            </span>
            <span className={`inline-flex items-center gap-1 ${canCreatePayrun ? 'text-[#15803D]' : 'text-slate-400 line-through'}`}>
              {canCreatePayrun ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <X className="h-3.5 w-3.5 text-slate-400" />} Compute Payroll
            </span>
            <span className={`inline-flex items-center gap-1 ${canValidatePayrun ? 'text-[#15803D]' : 'text-slate-400 line-through'}`}>
              {canValidatePayrun ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <X className="h-3.5 w-3.5 text-slate-400" />} Validate Payruns
            </span>
            <span className={`inline-flex items-center gap-1 ${canManageUsers ? 'text-[#15803D]' : 'text-slate-400 line-through'}`}>
              {canManageUsers ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <X className="h-3.5 w-3.5 text-slate-400" />} User Management
            </span>
          </div>
        </div>
      </div>

      {/* 📊 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} to={stat.link} className="block group">
              <div className="bg-white p-5 rounded-3xl border border-[#EADBCE] shadow-xs hover:shadow-md hover:border-[#8C532B]/40 transition-all duration-200 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#735338] uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${stat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-black text-[#381E0D] tracking-tight">
                      {stat.value}
                    </div>
                    <p className="text-[11px] text-[#735338] font-medium mt-0.5">{stat.total}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#78350F] border border-[#EADBCE]">
                    {stat.badge}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 🧭 Operational Flow Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/payroll"
          className="p-3.5 bg-white rounded-2xl border border-[#EADBCE] hover:border-[#8C532B] hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-[#FAF2E8] text-[#8C532B] group-hover:scale-105 transition-transform">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#381E0D] group-hover:text-[#8C532B]">Payrun Cycles</h4>
            <p className="text-[10px] text-[#735338]">Process monthly batch</p>
          </div>
        </Link>

        <Link
          to="/employees"
          className="p-3.5 bg-white rounded-2xl border border-[#EADBCE] hover:border-[#8C532B] hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-[#F7EFE4] text-[#78350F] group-hover:scale-105 transition-transform">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#381E0D] group-hover:text-[#8C532B]">Employee 360°</h4>
            <p className="text-[10px] text-[#735338]">Directory &amp; profiles</p>
          </div>
        </Link>

        <Link
          to="/time-off"
          className="p-3.5 bg-white rounded-2xl border border-[#EADBCE] hover:border-[#8C532B] hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-[#FFFBEB] text-[#B45309] group-hover:scale-105 transition-transform">
            <CalendarOff className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#381E0D] group-hover:text-[#8C532B]">Leaves &amp; Time Off</h4>
            <p className="text-[10px] text-[#735338]">Approvals &amp; balances</p>
          </div>
        </Link>

        <Link
          to="/payslips"
          className="p-3.5 bg-white rounded-2xl border border-[#EADBCE] hover:border-[#8C532B] hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-[#F0FDF4] text-[#15803D] group-hover:scale-105 transition-transform">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#381E0D] group-hover:text-[#8C532B]">Payslips Archive</h4>
            <p className="text-[10px] text-[#735338]">Download &amp; dispatch</p>
          </div>
        </Link>
      </div>

      {/* 📈 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Payroll Expenditure Trends */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EADBCE]">
            <div>
              <h3 className="text-base font-black text-[#381E0D]">Monthly Payroll Expenditure Trends</h3>
              <p className="text-xs text-[#735338]">Gross vs Net compensation disbursed over recent pay cycles</p>
            </div>
            <Link to="/payroll" className="text-xs font-bold text-[#8C532B] hover:underline flex items-center gap-1">
              View Payruns <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics?.salary_trends || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C532B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8C532B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF7F2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#735338' }} stroke="#EADBCE" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#735338' }}
                  stroke="#EADBCE"
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #EADBCE',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="gross_payroll"
                  name="Gross Salary"
                  stroke="#8C532B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#grossGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="net_payroll"
                  name="Net Disbursed"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EADBCE]">
            <div>
              <h3 className="text-base font-black text-[#381E0D]">Headcount by Dept</h3>
              <p className="text-xs text-[#735338]">Team allocation</p>
            </div>
            <span className="text-xs font-bold text-[#8C532B]">{kpis?.total_employees ?? 48} Staff</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.department_distribution || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#FAF7F2" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#735338' }} stroke="#EADBCE" />
                <YAxis
                  type="category"
                  dataKey="department"
                  tick={{ fontSize: 10, fill: '#381E0D' }}
                  width={85}
                  stroke="#EADBCE"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #EADBCE',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Employees" fill="#8C532B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🚀 Quick Actions & System Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Approvals Queue */}
        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EADBCE]">
            <div>
              <h3 className="text-base font-black text-[#381E0D]">Approvals &amp; System Alerts</h3>
              <p className="text-xs text-[#735338]">Action items requiring HR or Payroll sign-off</p>
            </div>
            <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
              {metrics?.quick_alerts?.length ?? 0} Pending
            </span>
          </div>

          <div className="space-y-3">
            {metrics?.quick_alerts && metrics.quick_alerts.length > 0 ? (
              metrics.quick_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] text-[#4A2810] text-xs font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-[#B45309] shrink-0" />
                    <span>{alert.message}</span>
                  </div>
                  <Link
                    to="/time-off"
                    className="text-[#8C532B] hover:text-[#7B3F1B] font-bold text-xs shrink-0 flex items-center gap-1 ml-2"
                  >
                    Review <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#735338]">
                <CheckCircle2 className="h-5 w-5 text-[#15803D] mx-auto mb-1" />
                All approval queues are clear!
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Audit Trail */}
        <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EADBCE]">
            <div>
              <h3 className="text-base font-black text-[#381E0D]">Recent Activity Audit Trail</h3>
              <p className="text-xs text-[#735338]">Real-time system events</p>
            </div>
            <span className="text-xs font-mono text-[#8C532B]/60 font-bold">24h Log</span>
          </div>

          <div className="divide-y divide-[#EADBCE]/50">
            {metrics?.recent_activities?.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#381E0D]">{act.title}</p>
                  <p className="text-[11px] text-[#735338] mt-0.5">Executed by {act.user}</p>
                </div>
                <span className="text-[10px] font-bold text-[#8C532B]/70 bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EADBCE]">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
