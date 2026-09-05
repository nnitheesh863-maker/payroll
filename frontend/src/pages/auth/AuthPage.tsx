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
  Star,
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

  // Status States
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
        err?.response?.data?.detail || 'Invalid email or password. Please verify your credentials.'
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
      await register(regFullName || 'Administrator', regEmail, regRole);
      setSuccessMsg('Workspace created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to create workspace. Please try again.');
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
    setSuccessMsg(null);
    setIsSignUp(targetSignUp);
    navigate(targetSignUp ? '/register' : '/login');
  };

  const demoRoles = [
    {
      role: 'ADMIN' as Role,
      label: 'Admin',
      email: 'admin@peoplepay360.com',
      pass: 'Admin@123',
      color: 'bg-[#FAF2E8] hover:bg-[#F5E8D8] text-[#78350F] border-[#E8D5C0]',
    },
    {
      role: 'HR_MANAGER' as Role,
      label: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'HrManager@123',
      color: 'bg-[#F7EFE4] hover:bg-[#F2E4D4] text-[#8C532B] border-[#E2CEB9]',
    },
    {
      role: 'HR_PAYROLL_MANAGER' as Role,
      label: 'Payroll Manager',
      email: 'payrollmanager@peoplepay360.com',
      pass: 'PayrollManager@123',
      color: 'bg-[#F3EFEA] hover:bg-[#EAE4DC] text-[#633B1C] border-[#DDD0C2]',
    },
    {
      role: 'EMPLOYEE' as Role,
      label: 'Employee',
      email: 'employee@peoplepay360.com',
      pass: 'Employee@123',
      color: 'bg-[#FDFBF7] hover:bg-[#F8F2E8] text-[#573A25] border-[#EADBCE]',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#EADCC9] selection:text-[#78350F] relative font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#EADCC9]/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#E2CDB6]/40 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#d8c7b5_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
      </div>

      {/* Clean Top Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#8C532B] via-[#9E6237] to-[#B87B4C] flex items-center justify-center text-white font-bold shadow-md shadow-[#8C532B]/20 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[#381E0D]">
              People<span className="text-[#8C532B]">Pay360</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#633B1C] hover:text-[#8C532B] px-3.5 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#EADBCE] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Glassmorphic Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl glass-card rounded-3xl border border-[#EADBCE]/90 shadow-[0_20px_50px_rgba(120,53,15,0.06)] overflow-hidden relative min-h-[580px] flex flex-col lg:flex-row bg-white/95">

          {/* ========================================================================= */}
          {/* PANEL 1: SIGN IN (LEFT)                                                   */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-all duration-500 ease-in-out ${
              isSignUp
                ? 'hidden lg:flex opacity-0 pointer-events-none translate-x-[-20px]'
                : 'flex opacity-100 translate-x-0'
            }`}
          >
            <div>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-3 py-1 rounded-full mb-3">
                  <Sparkles className="h-3 w-3 text-[#8C532B]" />
                  Secure Access
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#381E0D] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-[#735338] mt-1">
                  Enter your corporate credentials to access your workspace.
                </p>
              </div>

              {error && !isSignUp && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="email"
                      placeholder="admin@peoplepay360.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-11 pr-4 py-2.5 text-sm text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#4A2810]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-[#8C532B] hover:text-[#6E3B1F] hover:underline font-semibold cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-11 pr-10 py-2.5 text-sm text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C532B]/60 hover:text-[#8C532B] cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8C532B]/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Sandbox Fast Login */}
              <div className="mt-6 pt-5 border-t border-[#EADBCE]/80">
                <p className="text-[11px] font-bold text-[#6E492B] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Zap className="h-3 w-3 text-[#B45309]" />
                  Instant Role Sandbox:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoRoles.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleQuickLogin(r.role, r.email, r.pass)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold text-left truncate cursor-pointer hover:scale-[1.02] active:scale-95 transition-all ${r.color}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Switcher */}
            <div className="mt-6 pt-4 border-t border-[#EADBCE]/80 text-center lg:hidden">
              <p className="text-xs text-[#735338]">
                Don't have a workspace?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(true)}
                  className="text-[#8C532B] font-bold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PANEL 2: SIGN UP / REGISTER (RIGHT)                                       */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-all duration-500 ease-in-out ${
              !isSignUp
                ? 'hidden lg:flex opacity-0 pointer-events-none translate-x-[20px]'
                : 'flex opacity-100 translate-x-0'
            }`}
          >
            <div>
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-3 py-1 rounded-full mb-3">
                  <Building2 className="h-3 w-3 text-[#8C532B]" />
                  Get Started
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#381E0D] tracking-tight">
                  Create your workspace
                </h2>
                <p className="text-xs sm:text-sm text-[#735338] mt-1">
                  Set up your company's payroll portal in under a minute.
                </p>
              </div>

              {error && isSignUp && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4A2810] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                        <User className="h-3 w-3" />
                      </div>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-9 pr-3 py-2 text-xs text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A2810] mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                        <Briefcase className="h-3 w-3" />
                      </div>
                      <input
                        type="text"
                        placeholder="Acme Global Inc."
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-9 pr-3 py-2 text-xs text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                      <Mail className="h-3 w-3" />
                    </div>
                    <input
                      type="email"
                      placeholder="alex@company.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-9 pr-3 py-2 text-xs text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4A2810] mb-1">
                      Primary Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as Role)}
                      className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 px-3 py-2 text-xs text-[#381E0D] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium cursor-pointer"
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A2810] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded bg-[#F5ECE0] flex items-center justify-center text-[#8C532B]">
                        <Lock className="h-3 w-3" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#E5D7C7] bg-[#FAF7F2]/80 pl-9 pr-8 py-2 text-xs text-[#381E0D] placeholder-[#A38A73] focus:border-[#8C532B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8C532B]/10 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C532B]/60 hover:text-[#8C532B] cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8C532B]/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
            </div>

            {/* Mobile Switcher */}
            <div className="mt-6 pt-4 border-t border-[#EADBCE]/80 text-center lg:hidden">
              <p className="text-xs text-[#735338]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(false)}
                  className="text-[#8C532B] font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SLIDING DECORATIVE OVERLAY (SANDALWOOD & TEA THEMED)                      */}
          {/* ========================================================================= */}
          <div
            className={`hidden lg:flex absolute top-0 bottom-0 w-1/2 p-10 xl:p-12 flex-col justify-between text-white z-20 shadow-2xl transition-all duration-500 ease-in-out ${
              isSignUp
                ? 'left-0 rounded-l-3xl bg-gradient-to-br from-[#7B3F1B] via-[#8F4E24] to-[#B36F3D]'
                : 'left-1/2 rounded-r-3xl bg-gradient-to-br from-[#8C532B] via-[#9E6237] to-[#B87B4C]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-black tracking-tight text-white">PeoplePay360</span>
              </div>
              <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white">
                {isSignUp ? 'Instant Setup' : 'Enterprise Suite'}
              </span>
            </div>

            {/* Dynamic Center Highlight */}
            <div className="space-y-4">
              {!isSignUp ? (
                <div className="space-y-4">
                  <h3 className="text-2xl xl:text-3xl font-black leading-tight text-white">
                    Disburse monthly payroll in <br />
                    <span className="underline decoration-[#FDE68A] underline-offset-8">
                      under 60 seconds.
                    </span>
                  </h3>
                  <p className="text-xs text-[#FDEBD2] leading-relaxed">
                    Automated tax compliance, real-time attendance multipliers, and instant PDF payslips.
                  </p>

                  <div className="bg-white/12 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Accuracy Rate</span>
                      <span className="text-[#FDE68A]">99.99%</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] h-full rounded-full w-[96%]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl xl:text-3xl font-black leading-tight text-white">
                    Join over 1,200+ <br />
                    <span className="underline decoration-[#FDE68A] underline-offset-8">
                      forward-thinking teams.
                    </span>
                  </h3>
                  <p className="text-xs text-[#FDEBD2] leading-relaxed">
                    Streamline salaries, statutory deductions (PF, ESI, TDS), and employee self-service.
                  </p>

                  <div className="space-y-2 text-xs text-white/95">
                    <div className="flex items-center gap-2 bg-white/10 p-2.5 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-[#FDE68A] shrink-0" />
                      <span>5-Tier RBAC Architecture</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 p-2.5 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-[#FDE68A] shrink-0" />
                      <span>Automated Statutory Deductions</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Switcher */}
            <div className="pt-5 border-t border-white/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  {!isSignUp ? "Don't have a workspace?" : 'Already registered?'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleAuthMode(!isSignUp)}
                className="bg-white text-[#573A25] hover:bg-[#FAF7F2] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-1"
              >
                <span>{!isSignUp ? 'Create Workspace' : 'Sign In'}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#8C532B]" />
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[#8C532B]/70 flex flex-col sm:flex-row items-center justify-between border-t border-[#EADBCE]/80 mt-auto font-medium">
        <p>&copy; {new Date().getFullYear()} PeoplePay360. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-[#8C532B] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#8C532B] transition-colors">Security Standards</a>
          <a href="#" className="hover:text-[#8C532B] transition-colors">Support Desk</a>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-[#381E0D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EADBCE] rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#8C532B]/60 hover:text-[#8C532B] p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#F5ECE0] border border-[#E8D4BE] flex items-center justify-center text-[#8C532B]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#381E0D]">Password Assistance</h3>
                <p className="text-xs text-[#735338]">Corporate Security Policy</p>
              </div>
            </div>
            <p className="text-xs text-[#6E492B] leading-relaxed mb-6">
              Employee credentials are managed centrally. Please contact your system administrator or HR manager to reset your password.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
