import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  UserCheck,
  Eye,
  EyeOff,
  Briefcase,
  ChevronRight,
  Zap,
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
      setSuccessMsg('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
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
      setError('Could not connect. Redirecting via demo mode.');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const demoRoles: { role: Role; label: string; email: string; pass: string; color: string; desc: string }[] = [
    {
      role: 'ADMIN',
      label: 'Admin (Full Access)',
      email: 'admin@peoplepay360.com',
      pass: 'Admin@123',
      color: 'bg-purple-950/40 text-purple-200 border-purple-700/50 hover:bg-purple-900/60',
      desc: 'Universal management & security'
    },
    {
      role: 'HR_MANAGER',
      label: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'HrManager@123',
      color: 'bg-blue-950/40 text-blue-200 border-blue-700/50 hover:bg-blue-900/60',
      desc: 'Employee directory & leave approvals'
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      label: 'Payroll Manager',
      email: 'payrollmanager@peoplepay360.com',
      pass: 'PayrollManager@123',
      color: 'bg-emerald-950/40 text-emerald-200 border-emerald-700/50 hover:bg-emerald-900/60',
      desc: 'Validate payruns & disburse net salaries'
    },
    {
      role: 'HR_PAYROLL_USER',
      label: 'Payroll Specialist',
      email: 'payrolluser@peoplepay360.com',
      pass: 'PayrollUser@123',
      color: 'bg-amber-950/40 text-amber-200 border-amber-700/50 hover:bg-amber-900/60',
      desc: 'Salary rules & deduction structures'
    },
    {
      role: 'EMPLOYEE',
      label: 'Employee (Self-Service)',
      email: 'employee@peoplepay360.com',
      pass: 'Employee@123',
      color: 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800',
      desc: 'Punch attendance & download payslips'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0C14] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative font-sans text-slate-100 antialiased overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Breadcrumb / Return to Landing */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between z-10 px-2">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
            Backend API Online &bull; v2.4
          </span>
        </div>
      </div>

      {/* Main Dual-Sided Sliding Container */}
      <div className="w-full max-w-5xl bg-[#121520] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-[640px] flex flex-col lg:flex-row">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SIGN IN FORM                                                 */}
        {/* ========================================================================= */}
        <div
          className={`w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-between transition-all duration-500 ease-in-out ${
            isSignUp ? 'hidden lg:flex opacity-30 pointer-events-none scale-95' : 'flex opacity-100 scale-100'
          }`}
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight">PeoplePay360</h1>
                  <p className="text-[11px] text-slate-400 font-medium">Enterprise HR &amp; Payroll Portal</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/50 px-2.5 py-1 rounded-full">
                Sign In
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access your organization dashboard
              </p>
            </div>

            {error && !isSignUp && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/70 flex items-start gap-2 text-rose-300 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to PeoplePay360</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Personas */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  1-Click Role Sandbox
                </span>
                <span className="text-[10px] font-mono text-slate-500">5 Roles</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoRoles.slice(0, 4).map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleQuickLogin(r.role, r.email, r.pass)}
                    className={`p-2 rounded-xl border text-[11px] font-medium transition-all text-left truncate cursor-pointer ${r.color}`}
                  >
                    <p className="font-bold truncate">{r.label}</p>
                    <p className="text-[9px] opacity-70 truncate">{r.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center lg:hidden">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  navigate('/register');
                }}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
              >
                Create Workspace
              </button>
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SIGN UP / REGISTER FORM                                     */}
        {/* ========================================================================= */}
        <div
          className={`w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-between transition-all duration-500 ease-in-out ${
            !isSignUp ? 'hidden lg:flex opacity-30 pointer-events-none scale-95' : 'flex opacity-100 scale-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight">PeoplePay360</h1>
                  <p className="text-[11px] text-slate-400 font-medium">New Workspace Onboarding</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2.5 py-1 rounded-full">
                Register
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                Set up your company payroll in minutes with full automation
              </p>
            </div>

            {error && isSignUp && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/70 flex items-start gap-2 text-rose-300 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/70 flex items-start gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Briefcase className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Acme Global Inc."
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="alex@acme.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
                    <option value="HR_PAYROLL_USER">Payroll Specialist</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-[#0B0D14] pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span>Building Workspace...</span>
                ) : (
                  <>
                    <span>Create Free Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 p-3 rounded-xl bg-[#0B0D14] border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Enterprise Compliance Guaranteed
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Includes automated PF, ESI, TDS calculation rules, multi-tier RBAC guards, and audit trail.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center lg:hidden">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  navigate('/login');
                }}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SLIDING OVERLAY PANEL (DESKTOP ANIMATION)                                  */}
        {/* ========================================================================= */}
        <div
          className={`hidden lg:flex absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-blue-900 via-indigo-950 to-[#0F111D] p-10 flex-col justify-between text-white border-slate-700/60 z-20 shadow-2xl transition-all duration-700 ease-in-out ${
            isSignUp
              ? 'left-0 rounded-l-3xl border-r'
              : 'left-1/2 rounded-r-3xl border-l'
          }`}
        >
          {/* Top Logo & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-300" />
              </div>
              <span className="text-sm font-bold tracking-wide">PeoplePay360</span>
            </div>
            <span className="text-[10px] font-mono bg-white/10 backdrop-blur-xs border border-white/20 px-2.5 py-0.5 rounded-full text-blue-200">
              {isSignUp ? 'Free Tier' : 'Enterprise'}
            </span>
          </div>

          {/* Central Interactive Animation Content */}
          <div className="space-y-6">
            {!isSignUp ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Autonomous HR &amp; Payroll ERP</span>
                </div>
                <h3 className="text-3xl font-extrabold leading-tight tracking-tight">
                  Disburse Salaries in <br />
                  <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                    Under 60 Seconds
                  </span>
                </h3>
                <p className="text-xs text-blue-100/80 leading-relaxed max-w-sm">
                  Experience full statutory accuracy, tax deduction algorithms, attendance synchronization, and instant PDF payslips.
                </p>

                {/* Animated Stat Pill */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200">Active Cycle Performance</span>
                    <span className="font-mono text-emerald-300 font-bold">99.99% Error-Free</span>
                  </div>
                  <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full w-[94%]" />
                  </div>
                  <p className="text-[10px] text-blue-200/70">
                    Trusted by 1,200+ companies worldwide
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Instant Team Onboarding</span>
                </div>
                <h3 className="text-3xl font-extrabold leading-tight tracking-tight">
                  Join 150,000+ <br />
                  <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-blue-200 bg-clip-text text-transparent">
                    Happy Employees
                  </span>
                </h3>
                <p className="text-xs text-purple-100/80 leading-relaxed max-w-sm">
                  Set up your organization, customize salary formulas, invite your team, and run your first payroll today.
                </p>

                {/* Highlights List */}
                <div className="space-y-2 text-xs text-purple-100/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>Instant 5-Tier Role-Based Permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>Custom Tax Slabs &amp; Allowance Rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>Zero Setup Fees &bull; No Credit Card Needed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Switcher Button */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200/80 font-medium">
                {!isSignUp ? "Don't have a workspace yet?" : 'Already have an account?'}
              </p>
              <p className="text-[11px] text-white/60">
                {!isSignUp ? 'Launch a free 14-day trial' : 'Sign in to access your dashboard'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !isSignUp;
                setIsSignUp(next);
                navigate(next ? '/register' : '/login');
              }}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-lg"
            >
              <span>{!isSignUp ? 'Sign Up' : 'Sign In'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181B25] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Password Assistance</h3>
                <p className="text-xs text-slate-400">Enterprise Security Policy</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-slate-800 text-xs text-slate-300 space-y-2 mb-5">
              <p className="font-semibold text-slate-200">
                Employee and manager accounts are managed centrally.
              </p>
              <p>
                To reset or retrieve your work credentials, please contact your system administrator or HR Manager.
              </p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
