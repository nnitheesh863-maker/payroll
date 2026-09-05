import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Briefcase,
  ChevronRight,
  Zap,
  TrendingUp,
  Star,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState<boolean>(
    initialMode === 'register' || location.pathname === '/register'
  );

  // Sync mode with route changes
  useEffect(() => {
    setIsSignUp(location.pathname === '/register' || initialMode === 'register');
  }, [location.pathname, initialMode]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('admin@peoplepay360.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('HR_MANAGER');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Common States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, register, quickLoginAsRole } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Invalid credentials. Please verify your work email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(regFullName || 'New Administrator', regEmail, regRole);
      setSuccessMsg('Workspace created successfully! Launching your ERP dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: Role, roleEmail: string, rolePass: string) => {
    setLoginEmail(roleEmail);
    setLoginPassword(rolePass);
    setError(null);
    setIsLoading(true);
    try {
      await quickLoginAsRole(role);
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = (targetSignUp: boolean) => {
    setError(null);
    setIsSignUp(targetSignUp);
    navigate(targetSignUp ? '/register' : '/login');
  };

  const demoRoles: { role: Role; label: string; email: string; pass: string; badge: string; color: string }[] = [
    {
      role: 'ADMIN',
      label: 'System Admin',
      email: 'admin@peoplepay360.com',
      pass: 'Admin@123',
      badge: 'Full Access',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200/90'
    },
    {
      role: 'HR_MANAGER',
      label: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'HrManager@123',
      badge: 'Team & Leaves',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200/90'
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      label: 'Payroll Manager',
      email: 'payrollmanager@peoplepay360.com',
      pass: 'PayrollManager@123',
      badge: 'Payruns & Net',
      color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200/90'
    },
    {
      role: 'HR_PAYROLL_USER',
      label: 'Payroll Specialist',
      email: 'payrolluser@peoplepay360.com',
      pass: 'PayrollUser@123',
      badge: 'Salary Rules',
      color: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90'
    },
    {
      role: 'EMPLOYEE',
      label: 'Employee Portal',
      email: 'employee@peoplepay360.com',
      pass: 'Employee@123',
      badge: 'Self-Service',
      color: 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200/90'
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] flex flex-col justify-between selection:bg-blue-600 selection:text-white relative font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Background Decorative Soft Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/35 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-100/50 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              People<span className="text-blue-600">Pay360</span>
            </span>
            <span className="block text-[10px] font-semibold text-slate-500 -mt-1 tracking-wider uppercase">
              Enterprise HR &amp; Payroll
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3.5 py-1.5 rounded-lg hover:bg-white/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Landing Page</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server Online &bull; v2.4</span>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Split Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl bg-white border border-slate-200/80 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden relative min-h-[660px] flex flex-col lg:flex-row">

          {/* ========================================================================= */}
          {/* FORM PANEL 1: SIGN IN (LEFT SIDE)                                        */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-all duration-700 ease-in-out ${
              isSignUp
                ? 'hidden lg:flex opacity-20 pointer-events-none translate-x-[-20px]'
                : 'flex opacity-100 translate-x-0'
            }`}
          >
            <div>
              {/* Form Badge & Heading */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Secure Workspace Access
                </span>
                <span className="text-xs font-mono text-slate-400">JWT 256-Bit</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your registered corporate email and password below.
              </p>

              {error && !isSignUp && (
                <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form Inputs */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="e.g. admin@peoplepay360.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to PeoplePay360</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Role Switcher Quick Logins */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Instant 1-Click Role Sandbox
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pre-seeded</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoRoles.slice(0, 4).map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleQuickLogin(r.role, r.email, r.pass)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left truncate cursor-pointer shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-95 ${r.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{r.label}</span>
                        <span className="text-[9px] opacity-75 font-mono px-1 py-0.5 rounded bg-white/80">
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-70 truncate mt-0.5">{r.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Mode Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center lg:hidden">
              <p className="text-xs text-slate-600">
                Don't have an enterprise workspace?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(true)}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Create Workspace
                </button>
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORM PANEL 2: SIGN UP / REGISTER (RIGHT SIDE)                             */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-all duration-700 ease-in-out ${
              !isSignUp
                ? 'hidden lg:flex opacity-20 pointer-events-none translate-x-[20px]'
                : 'flex opacity-100 translate-x-0'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full">
                  <Building2 className="h-3 w-3" />
                  New Organization Setup
                </span>
                <span className="text-xs font-mono text-slate-400">14-Day Sandbox</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create your workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configure your payroll engine and begin managing employees.
              </p>

              {error && isSignUp && (
                <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-700 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Acme Global Inc."
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="alex@acme.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as Role)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium cursor-pointer"
                    >
                      <option value="ADMIN">Administrator (Full Control)</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
                      <option value="HR_PAYROLL_USER">Payroll Specialist</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Creating Workspace...</span>
                  ) : (
                    <>
                      <span>Create Free Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Compliance Note */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Includes automated statutory deductions (PF, ESI, TDS), salary formula builders, and one-click PDF generation.
                </span>
              </div>
            </div>

            {/* Mobile Mode Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center lg:hidden">
              <p className="text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(false)}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SLIDING ANIMATED OVERLAY (DESKTOP DYNAMIC CARD)                           */}
          {/* ========================================================================= */}
          <div
            className={`hidden lg:flex absolute top-0 bottom-0 w-1/2 p-10 xl:p-12 flex-col justify-between text-white z-20 shadow-2xl transition-all duration-700 ease-in-out ${
              isSignUp
                ? 'left-0 rounded-l-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800'
                : 'left-1/2 rounded-r-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700'
            }`}
          >
            {/* Top Showcase Branding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-black tracking-tight">PeoplePay360</span>
              </div>
              <span className="text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-white">
                {isSignUp ? 'Free Organization Tier' : 'Enterprise Suite'}
              </span>
            </div>

            {/* Interactive Dynamic Center Content with Motion */}
            <div className="space-y-6">
              {!isSignUp ? (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Autonomous Payroll Execution</span>
                  </div>

                  <h3 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight">
                    Disburse monthly payroll in <br />
                    <span className="underline decoration-sky-300 underline-offset-8">
                      under 60 seconds.
                    </span>
                  </h3>

                  <p className="text-xs xl:text-sm text-blue-100/90 leading-relaxed max-w-md">
                    Experience automatic tax compliance, real-time leave &amp; attendance multipliers, and instant PDF payslip distribution.
                  </p>

                  {/* Interactive Stats Showcase Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Payroll Accuracy Rate</span>
                      <span className="font-mono font-bold text-emerald-300">99.99% Guaranteed</span>
                    </div>
                    <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-sky-300 via-teal-300 to-emerald-300 h-full rounded-full w-[96%]" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-blue-100/80 pt-1">
                      <span>150K+ Monthly Payslips</span>
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> 4.9/5 Rating
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold">
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    <span>Instant Workspace Onboarding</span>
                  </div>

                  <h3 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight">
                    Join over 1,200+ <br />
                    <span className="underline decoration-pink-300 underline-offset-8">
                      forward-thinking teams.
                    </span>
                  </h3>

                  <p className="text-xs xl:text-sm text-purple-100/90 leading-relaxed max-w-md">
                    Empower your HR &amp; Finance team with custom salary structures, automated tax brackets, and self-service portals.
                  </p>

                  {/* Feature Checkpoints */}
                  <div className="space-y-2.5 text-xs text-white/95">
                    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span>5-Tier RBAC Architecture for Total Security</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span>Custom Allowances, Deductions &amp; TDS Rules</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span>Zero Setup Fees &bull; Instant Dashboard Access</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Interactive Switcher Button */}
            <div className="pt-6 border-t border-white/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  {!isSignUp ? "Don't have a workspace yet?" : 'Already have an existing account?'}
                </p>
                <p className="text-[11px] text-white/75">
                  {!isSignUp ? 'Launch a free 14-day organization trial' : 'Sign in to access your ERP dashboard'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleAuthMode(!isSignUp)}
                className="bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
              >
                <span>{!isSignUp ? 'Create Workspace' : 'Sign In'}</span>
                <ChevronRight className="h-4 w-4 text-slate-700" />
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 mt-auto">
        <p>&copy; {new Date().getFullYear()} PeoplePay360. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Security &amp; Compliance</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Support Desk</a>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password Assistance</h3>
                <p className="text-xs text-slate-500">Corporate Security Policy</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 mb-6">
              <p className="font-semibold text-slate-900">
                Employee and manager credentials are authenticated centrally.
              </p>
              <p className="text-slate-600 leading-relaxed">
                If you have forgotten your password or require a reset link, please contact your system administrator or HR Manager.
              </p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              Understood, Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
