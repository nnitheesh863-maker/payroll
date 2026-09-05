import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  CreditCard,
  BarChart3,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
  Globe2,
  Layers,
  FileCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { quickLoginAsRole } = useAuth();

  const handleQuickDemo = async (role: Role) => {
    await quickLoginAsRole(role);
    navigate('/dashboard');
  };

  const metrics = [
    { label: 'Calculation Accuracy', value: '99.99%', detail: 'Tax & PF auto-rules' },
    { label: 'Active Employees', value: '150K+', detail: 'Across 40+ countries' },
    { label: 'Payroll Time Saved', value: '85%', detail: 'Automated 1-click runs' },
    { label: 'Uptime SLA', value: '99.9%', detail: 'Bank-grade security' },
  ];

  const features = [
    {
      icon: <CreditCard className="h-6 w-6 text-blue-400" />,
      title: 'Automated Payroll Engine',
      description: 'Compute gross-to-net pay, statutory deductions (PF, ESI, TDS), and bonuses in seconds with zero manual errors.',
      tag: 'Core Engine'
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      title: 'Employee Self-Service',
      description: 'Empower teams to view attendance records, apply for leave, manage tax declarations, and download PDF payslips.',
      tag: 'Self-Service'
    },
    {
      icon: <Clock className="h-6 w-6 text-emerald-400" />,
      title: 'Smart Attendance & Leaves',
      description: 'Real-time clock-in tracking, overtime multipliers, leave balance calculations, and manager approval queues.',
      tag: 'Time & Attendance'
    },
    {
      icon: <Lock className="h-6 w-6 text-purple-400" />,
      title: '5-Tier RBAC Architecture',
      description: 'Fine-grained permissions for Admins, HR Managers, Payroll Specialists, Auditors, and Employees.',
      tag: 'Enterprise Security'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-amber-400" />,
      title: 'Pixel-Perfect Payslip Generation',
      description: 'Generate standardized, audit-ready PDF payslips with one click, distributed securely to employee portals.',
      tag: 'Compliance'
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-cyan-400" />,
      title: 'Executive Analytics & Forecasts',
      description: 'Visualize department payroll costs, headcount projections, and compensation benchmarks with interactive charts.',
      tag: 'Analytics'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="relative z-20 border-b border-slate-800/80 bg-[#0B0D14]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                People<span className="text-blue-500">Pay360</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full">
                HR &amp; Payroll ERP
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#metrics" className="hover:text-blue-400 transition-colors">Performance</a>
            <a href="#demo" className="hover:text-blue-400 transition-colors">Interactive Demo</a>
            <a href="#security" className="hover:text-blue-400 transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/50 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Payroll &amp; Compensation Platform</span>
            <span className="h-1 w-1 rounded-full bg-blue-400" />
            <span className="text-slate-400">Enterprise Edition 2026</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Transform Payroll into an <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Autonomous Engine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate calculation discrepancies, automate multi-state tax deductions, disburse salaries with 1-click, and deliver instant self-service payslips to thousands of employees.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Start Workspace</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto text-base font-semibold bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-8 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Login Portal</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant Role Sandbox
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Bank-Grade Security
            </span>
          </div>
        </div>

        {/* Interactive Hero Dashboard Preview Card */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="rounded-3xl p-1 bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-transparent shadow-2xl">
            <div className="bg-[#12141D] rounded-[22px] border border-slate-800 p-6 sm:p-8 overflow-hidden relative">
              {/* Header inside Mockup */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Live Payroll Run Simulator</h3>
                    <p className="text-xs text-slate-400">September 2026 Cycle &bull; 148 Employees Processed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Validation Passed: 100%
                  </span>
                </div>
              </div>

              {/* Grid of Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#181B26] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Total Gross Payroll</p>
                  <p className="text-2xl font-black text-white mt-1">$482,950.00</p>
                  <div className="mt-2 flex items-center text-xs text-emerald-400 font-medium gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+4.2% from last cycle</span>
                  </div>
                </div>

                <div className="bg-[#181B26] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Statutory &amp; Tax Deductions</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">$68,410.00</p>
                  <div className="mt-2 flex items-center text-xs text-slate-400 font-medium gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                    <span>Auto-calculated TDS &amp; PF</span>
                  </div>
                </div>

                <div className="bg-[#181B26] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Disbursed Net Pay</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">$414,540.00</p>
                  <div className="mt-2 flex items-center text-xs text-emerald-400 font-medium gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Instant Direct Deposit</span>
                  </div>
                </div>
              </div>

              {/* One-click quick login bar directly from the showcase */}
              <div id="demo" className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    Test Drive Any Role with 1 Click:
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Jump directly into role-specific management views</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickDemo('ADMIN')}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/50 hover:bg-purple-800/60 text-purple-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Admin Portal
                  </button>
                  <button
                    onClick={() => handleQuickDemo('HR_MANAGER')}
                    className="px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-700/50 hover:bg-blue-800/60 text-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    HR Manager
                  </button>
                  <button
                    onClick={() => handleQuickDemo('HR_PAYROLL_MANAGER')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/50 hover:bg-emerald-800/60 text-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Payroll Exec
                  </button>
                  <button
                    onClick={() => handleQuickDemo('EMPLOYEE')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Employee Portal
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section id="metrics" className="border-y border-slate-800/80 bg-[#0E1018] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {metrics.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  {m.value}
                </p>
                <p className="text-sm font-semibold text-white">{m.label}</p>
                <p className="text-xs text-slate-400">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered for Modern HR &amp; Finance Teams
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            From automated salary formulas to tax audits and direct employee self-service, PeoplePay360 handles the entire lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="bg-[#141622] rounded-2xl border border-slate-800/80 p-6 hover:border-slate-700 transition-all hover:translate-y-[-2px] group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-700/40 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Streamline Your Payroll Operations?
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
            Join enterprise teams saving hundreds of hours every pay cycle with automated calculations and instant compliance.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Create Account Now
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-8 py-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Sign In to Existing Portal
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} PeoplePay360 Enterprise ERP. All rights reserved.</p>
      </footer>
    </div>
  );
};
