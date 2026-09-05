import React, { useState } from 'react';
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
  FileCheck,
  Clock,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { quickLoginAsRole } = useAuth();
  
  // Interactive Simulator State
  const [employeeCount, setEmployeeCount] = useState<number>(150);

  // Dynamic calculations based on slider
  const avgSalary = 3250;
  const grossPay = employeeCount * avgSalary;
  const taxDeductions = Math.round(grossPay * 0.142);
  const netPay = grossPay - taxDeductions;
  const hoursSaved = Math.round(employeeCount * 0.16);

  const handleQuickDemo = async (role: Role) => {
    await quickLoginAsRole(role);
    navigate('/dashboard');
  };

  const metrics = [
    { label: 'Calculation Accuracy', value: '99.99%', detail: 'Automated statutory rules' },
    { label: 'Active Employees', value: '150K+', detail: 'Across global enterprises' },
    { label: 'Time Saved per Run', value: '85%', detail: 'Zero manual spreadsheets' },
    { label: 'Bank-Grade SLA', value: '99.99%', detail: '256-bit encrypted vaults' },
  ];

  const features = [
    {
      icon: <CreditCard className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#8C532B] to-[#B87B4C] shadow-[#8C532B]/30',
      tagColor: 'text-[#78350F] bg-[#FAF2E8] border-[#E8D5C0]',
      title: 'Automated Gross-to-Net Engine',
      description: 'Compute complex statutory deductions (PF, ESI, TDS), dynamic overtime rates, and allowances in seconds without spreadsheet errors.',
      tag: 'Core Payroll'
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#9E6237] to-[#C4936A] shadow-[#9E6237]/30',
      tagColor: 'text-[#8C532B] bg-[#F7EFE4] border-[#E2CEB9]',
      title: 'Employee 360 & Self-Service',
      description: 'Self-service portal empowering employees to track attendance logs, submit leave requests, verify tax deductions, and download payslips.',
      tag: 'Self-Service'
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#633B1C] to-[#8F5528] shadow-[#633B1C]/30',
      tagColor: 'text-[#633B1C] bg-[#F3EFEA] border-[#DDD0C2]',
      title: 'Real-Time Attendance & Multipliers',
      description: 'Precision shift clock-in, automatic overtime calculation, synchronized time-off balances, and rapid manager approval queues.',
      tag: 'Attendance'
    },
    {
      icon: <Lock className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#7B3F1B] to-[#A05C2E] shadow-[#7B3F1B]/30',
      tagColor: 'text-[#92400E] bg-[#FAF5EE] border-[#EADCC9]',
      title: '5-Tier RBAC Architecture',
      description: 'Granular permissions segregating Admin, HR Manager, Payroll Manager, Payroll User, and Employee role capabilities with full audit trails.',
      tag: 'Security'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#B45309] to-[#D97706] shadow-[#B45309]/30',
      tagColor: 'text-[#78350F] bg-[#FFFBEB] border-[#FDE68A]',
      title: 'Pixel-Perfect Payslip Generation',
      description: 'Generate standardized, audit-ready PDF payslips with one click, complete with statutory line breakdowns and digital seals.',
      tag: 'Compliance'
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      glowColor: 'bg-gradient-to-tr from-[#A16207] to-[#CA8A04] shadow-[#A16207]/30',
      tagColor: 'text-[#854D0E] bg-[#FEFCE8] border-[#FEF08A]',
      title: 'Executive Analytics & Forecasting',
      description: 'Visualize company-wide payroll expenses, department headcount allocation, and variance forecasts with high-impact visual dashboards.',
      tag: 'Analytics'
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Attendance & Leave Sync',
      desc: 'Smart attendance punch cards and approved leave days automatically feed into the payroll calculation pipeline with zero manual entry.',
      badge: 'Real-Time Inputs'
    },
    {
      step: '02',
      title: 'Salary Structure & Statutory Rules',
      desc: 'The engine applies custom allowances, PF (12%), ESI, and progressive TDS tax brackets based on pre-configured employee contracts.',
      badge: 'Automated Processing'
    },
    {
      step: '03',
      title: '1-Click Direct Deposit & PDF Slips',
      desc: 'Authorize batch payruns, disburse net funds instantly, and publish password-protected PDF payslips directly to employee self-service portals.',
      badge: 'Instant Execution'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#381E0D] font-sans selection:bg-[#EADCC9] selection:text-[#78350F] relative overflow-x-hidden antialiased">
      
      {/* Background Subtle Sandalwood & Milk Tea Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#EADCC9]/50 via-[#F5ECE0]/40 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[25%] right-[-5%] w-[600px] h-[600px] bg-[#E2CDB6]/40 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] left-[-5%] w-[600px] h-[600px] bg-[#DFCEBC]/40 rounded-full blur-[140px]" />
        {/* Subtle dot matrix texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#d8c7b5_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
      </div>

      {/* Top Glassmorphic Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8C532B] via-[#9E6237] to-[#B87B4C] flex items-center justify-center text-white font-bold shadow-lg shadow-[#8C532B]/30 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#42220F]">
                People<span className="text-[#8C532B]">Pay360</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-2 py-0.5 rounded-full">
                Enterprise HR &amp; Payroll
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#633B1C]">
            <a href="#simulator" className="hover:text-[#8C532B] transition-colors">Live Simulator</a>
            <a href="#features" className="hover:text-[#8C532B] transition-colors">Core Features</a>
            <a href="#workflow" className="hover:text-[#8C532B] transition-colors">How It Works</a>
            <a href="#metrics" className="hover:text-[#8C532B] transition-colors">Performance</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-[#573A25] hover:text-[#8C532B] px-4 py-2.5 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#EADBCE] transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-bold bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-[#8C532B]/25 hover:shadow-[#8C532B]/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
          
          {/* Animated Hero Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-[#EADBCE] text-[#78350F] text-xs font-bold mb-8 shadow-xs animate-pulse-subtle">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C532B]"></span>
            </span>
            <Sparkles className="h-3.5 w-3.5 text-[#8C532B]" />
            <span>Autonomous Payroll &amp; Workforce Engine</span>
            <span className="h-1 w-1 rounded-full bg-[#D8C7B5]" />
            <span className="text-[#8C532B]/80 font-medium">Enterprise Edition 2026</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#381E0D] leading-[1.1]">
            Transform Payroll into an <br />
            <span className="bg-gradient-to-r from-[#8C532B] via-[#A86B3E] to-[#C48E60] bg-clip-text text-transparent">
              Autonomous &amp; Flawless Engine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-[#735338] max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate calculation errors, automate statutory deductions (PF, ESI, TDS), disburse salaries with 1-click, and deliver instant self-service payslips to thousands of employees.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto text-base font-bold bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white px-8 py-4 rounded-2xl shadow-xl shadow-[#8C532B]/30 hover:shadow-[#8C532B]/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto text-base font-bold bg-white hover:bg-[#FAF7F2] border border-[#EADBCE] text-[#573A25] px-8 py-4 rounded-2xl shadow-xs hover:shadow-md hover:border-[#D8C7B5] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Access Existing Portal</span>
              <ChevronRight className="h-4 w-4 text-[#8C532B]" />
            </button>
          </div>

          {/* Trust Value Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#6E492B]">
            <span className="flex items-center gap-1.5 bg-white/85 border border-[#EADBCE] px-3 py-1 rounded-full shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#8C532B]" /> 100% Tax &amp; Statutory Compliant
            </span>
            <span className="flex items-center gap-1.5 bg-white/85 border border-[#EADBCE] px-3 py-1 rounded-full shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#8C532B]" /> Instant 1-Click Role Sandbox
            </span>
            <span className="flex items-center gap-1.5 bg-white/85 border border-[#EADBCE] px-3 py-1 rounded-full shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#8C532B]" /> Bank-Grade 256-Bit Encryption
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE PAYROLL SIMULATOR CARD (WARM GLASS & GLOWING ACCENTS)          */}
        {/* ========================================================================= */}
        <div id="simulator" className="mt-16 relative max-w-5xl mx-auto">
          
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EADCC9]/50 via-[#E2CDB6]/50 to-[#F5ECE0]/50 rounded-3xl blur-2xl transform -rotate-1 pointer-events-none" />
          
          <div className="relative glass-card-glow rounded-3xl p-6 sm:p-10 border border-[#EADBCE]/90 shadow-2xl overflow-hidden bg-white/92">
            
            {/* Top Simulator Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#EADBCE]/70 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#8C532B] via-[#9E6237] to-[#B87B4C] flex items-center justify-center text-white shadow-lg shadow-[#8C532B]/30">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#381E0D] tracking-tight flex items-center gap-2">
                    Live Payroll Run Simulator
                    <span className="text-[11px] font-bold text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-2 py-0.5 rounded-md">
                      Interactive
                    </span>
                  </h3>
                  <p className="text-xs text-[#735338] font-medium mt-0.5">
                    Adjust employee count to simulate real-time salary disbursal &amp; tax rules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-[#F5ECE0] border border-[#E8D4BE] text-[#78350F] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-[#8C532B] animate-pulse" />
                  Validation: 0 Errors Found
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="mt-8 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-xs font-bold text-[#4A2810] flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#8C532B]" />
                  Simulate Company Headcount:
                </label>
                <span className="text-sm font-extrabold text-[#78350F] bg-white px-3 py-1 rounded-xl border border-[#EADBCE] shadow-2xs">
                  {employeeCount} Active Employees
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full h-2.5 bg-[#E8D9CB] rounded-lg appearance-none cursor-pointer accent-[#8C532B] focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-[#735338] font-semibold mt-2">
                <span>10 Staff (Startup)</span>
                <span>150 Staff (Mid-Market)</span>
                <span>500+ Staff (Enterprise)</span>
              </div>
            </div>

            {/* Dynamic Calculated Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              
              {/* Gross Pay */}
              <div className="bg-white p-5 rounded-2xl border border-[#EADBCE]/80 shadow-xs hover:border-[#8C532B]/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Gross Payroll</p>
                  <div className="h-8 w-8 rounded-xl bg-[#F5ECE0] border border-[#E8D4BE] flex items-center justify-center text-[#8C532B] group-hover:scale-110 transition-transform">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#381E0D] tracking-tight">
                  ${grossPay.toLocaleString()}.00
                </p>
                <p className="text-xs text-[#735338] mt-1 font-medium">
                  Base salaries + dynamic allowances
                </p>
              </div>

              {/* Deductions */}
              <div className="bg-white p-5 rounded-2xl border border-[#EADBCE]/80 shadow-xs hover:border-[#8C532B]/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Tax &amp; PF Deductions</p>
                  <div className="h-8 w-8 rounded-xl bg-[#FAF2E8] border border-[#E8D5C0] flex items-center justify-center text-[#78350F] group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#8C532B] tracking-tight">
                  ${taxDeductions.toLocaleString()}.00
                </p>
                <p className="text-xs text-[#735338] mt-1 font-medium">
                  Auto-calculated TDS, PF (12%), &amp; ESI
                </p>
              </div>

              {/* Net Disbursed */}
              <div className="bg-white p-5 rounded-2xl border border-[#EADBCE]/80 shadow-xs hover:border-[#8C532B]/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#735338] uppercase tracking-wider">Disbursed Net Pay</p>
                  <div className="h-8 w-8 rounded-xl bg-[#F7EFE4] border border-[#E2CEB9] flex items-center justify-center text-[#9E6237] group-hover:scale-110 transition-transform">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#633B1C] tracking-tight">
                  ${netPay.toLocaleString()}.00
                </p>
                <p className="text-xs text-[#735338] mt-1 font-medium">
                  ~{hoursSaved} hrs saved this pay cycle
                </p>
              </div>

            </div>

            {/* 1-Click Role Sandbox Direct Jump */}
            <div className="mt-8 pt-6 border-t border-[#EADBCE]/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#4A2810] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#8C532B]" />
                  Test Drive Any Role with 1-Click:
                </p>
                <p className="text-xs text-[#735338] mt-0.5">
                  Experience full enterprise workflows instantly without manual signup
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF2E8] hover:bg-[#F5E8D8] border border-[#E8D5C0] text-[#78350F] text-xs font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[#8C532B]" />
                  <span>Admin Portal</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('HR_MANAGER')}
                  className="px-3.5 py-2 rounded-xl bg-[#F7EFE4] hover:bg-[#F2E4D4] border border-[#E2CEB9] text-[#8C532B] text-xs font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[#9E6237]" />
                  <span>HR Manager</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('HR_PAYROLL_MANAGER')}
                  className="px-3.5 py-2 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] border border-[#DDD0C2] text-[#633B1C] text-xs font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[#7B3F1B]" />
                  <span>Payroll Exec</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('EMPLOYEE')}
                  className="px-3.5 py-2 rounded-xl bg-[#FDFBF7] hover:bg-[#F8F2E8] border border-[#EADBCE] text-[#573A25] text-xs font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[#A87B56]" />
                  <span>Employee Portal</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section id="metrics" className="border-y border-[#EADBCE]/80 bg-white/80 backdrop-blur-md py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {metrics.map((m, idx) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#B87B4C] bg-clip-text text-transparent">
                  {m.value}
                </p>
                <p className="text-sm font-extrabold text-[#381E0D]">{m.label}</p>
                <p className="text-xs text-[#735338] font-medium">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid with Glowing Sandalwood Cards */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF2E8] border border-[#E8D5C0] text-[#78350F] text-xs font-bold mb-3">
            <Layers className="h-3.5 w-3.5 text-[#8C532B]" />
            <span>Complete ERP Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#381E0D] tracking-tight">
            Engineered for High-Growth HR &amp; Finance Teams
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#735338]">
            From automated salary formulas to tax audits and direct employee self-service, PeoplePay360 handles the entire lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-7 card-hover-effect border border-[#EADBCE] group relative overflow-hidden bg-white/85"
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`h-12 w-12 rounded-2xl ${f.glowColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  {f.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${f.tagColor}`}>
                  {f.tag}
                </span>
              </div>
              <h3 className="text-lg font-black text-[#381E0D] group-hover:text-[#8C532B] transition-colors">
                {f.title}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-[#735338] leading-relaxed font-normal">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works / 3-Step Interactive Workflow */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="bg-gradient-to-b from-[#F5ECE0]/80 to-[#FAF7F2] border border-[#EADBCE] rounded-3xl p-8 sm:p-12 shadow-md">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-[#381E0D] tracking-tight">
              Payroll Processing in 3 Simple Steps
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#735338]">
              How PeoplePay360 turns complex salary cycles into a reliable, automated 60-second execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((w, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 border border-[#EADBCE] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-[#8C532B]/30">
                      {w.step}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-2 py-0.5 rounded">
                      {w.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#381E0D] mb-2">
                    {w.title}
                  </h3>
                  <p className="text-xs text-[#735338] leading-relaxed font-normal">
                    {w.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-[#7B3F1B] via-[#8F4E24] to-[#B36F3D] rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-[#8C532B]/20">
          
          {/* Decorative glow elements inside CTA */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#FDE68A]/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight relative z-10 text-white">
            Ready to Automate Your Payroll Operations?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#FDEBD2] max-w-xl mx-auto relative z-10 font-normal">
            Join hundreds of forward-thinking enterprises saving hours each cycle with guaranteed calculation accuracy and instant compliance.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-white hover:bg-[#FAF7F2] text-[#633B1C] font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Free Workspace</span>
              <ArrowUpRight className="h-4 w-4 text-[#8C532B]" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-black/20 hover:bg-black/30 text-white font-bold text-sm px-8 py-4 rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Sign In to Existing Portal
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EADBCE]/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-[#8C532B]/70 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#8C532B] flex items-center justify-center text-white font-bold text-xs">
            P
          </div>
          <span className="font-bold text-[#42220F]">PeoplePay360 Enterprise ERP</span>
        </div>
        <p>&copy; {new Date().getFullYear()} PeoplePay360 Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 text-[#633B1C]">
          <a href="#" className="hover:text-[#8C532B] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#8C532B] transition-colors">Security Standards</a>
          <a href="#" className="hover:text-[#8C532B] transition-colors">Compliance API</a>
        </div>
      </footer>

    </div>
  );
};
