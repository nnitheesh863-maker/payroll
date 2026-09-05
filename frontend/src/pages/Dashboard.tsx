import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { DashboardMetrics } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { usePermission } from '../hooks/usePermission';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, canCreatePayrun, canApproveLeaves } = usePermission();

  useEffect(() => {
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
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading PeoplePay360 dashboard..." />;
  }

  const kpis = metrics?.kpis;

  const statCards = [
    {
      title: 'Active Employees',
      value: kpis?.active_employees ?? 0,
      total: `${kpis?.total_employees ?? 0} total on roll`,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      link: '/employees',
    },
    {
      title: 'Monthly Payroll',
      value: `₹${((kpis?.total_payroll_last_month ?? 0) / 100000).toFixed(1)}L`,
      total: 'Disbursed last payrun',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      link: '/payroll',
    },
    {
      title: 'Today Attendance',
      value: `${kpis?.today_present ?? 0}`,
      total: `${kpis?.today_late ?? 0} late, ${kpis?.today_on_leave ?? 0} on leave`,
      icon: UserCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      link: '/attendance',
    },
    {
      title: 'Pending Approvals',
      value: kpis?.pending_leave_requests ?? 0,
      total: `${kpis?.pending_payruns ?? 0} payruns in progress`,
      icon: CalendarOff,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      link: '/time-off',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-primary-600">{user?.role?.replace(/_/g, ' ')}</span> &bull; PeoplePay360 HR &amp; Payroll Workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreatePayrun && (
            <Link to="/payroll">
              <Button size="sm" variant="primary" icon={<PlusCircle className="h-4 w-4" />}>
                Create Payrun
              </Button>
            </Link>
          )}
          <Link to="/time-off">
            <Button size="sm" variant="outline">
              Apply Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} to={stat.link} className="block group">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-lg border ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stat.total}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary Trends Chart */}
        <div className="lg:col-span-2">
          <Card
            title="Monthly Payroll Expenditure Trends"
            subtitle="Gross vs Net compensation disbursed over recent pay cycles (in INR)"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics?.salary_trends || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    stroke="#E2E8F0"
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="gross_payroll"
                    name="Gross Salary"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#grossGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="net_payroll"
                    name="Net Disbursed"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#netGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Department Distribution */}
        <div className="lg:col-span-1">
          <Card
            title="Department Allocation"
            subtitle="Headcount across teams"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics?.department_distribution || []}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#E2E8F0" />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    width={85}
                    stroke="#E2E8F0"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Headcount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Approvals & Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Alerts */}
        <Card title="System Alerts & Approvals Queue" subtitle="Action items requiring HR or Payroll attention">
          <div className="space-y-3">
            {metrics?.quick_alerts && metrics.quick_alerts.length > 0 ? (
              metrics.quick_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <Link to="/time-off" className="text-primary-600 hover:text-primary-700 font-semibold text-xs shrink-0 flex items-center gap-1">
                    Review <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                All queues are clear! No pending alerts.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity Audit Trail" subtitle="Latest actions across the ERP">
          <div className="divide-y divide-slate-100">
            {metrics?.recent_activities?.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{act.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">By {act.user}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{act.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
