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
  Clock,
  X,
  Eye,
  EyeOff,
  Briefcase,
  ChevronRight,
  AlertCircle,
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('HR_MANAGER');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registeredPendingInfo, setRegisteredPendingInfo] = useState<{
    name: string;
    email: string;
    role: Role;
  } | null>(null);

  // Status States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, register } = useAuth();

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
      const res: any = await register(
        regFullName || (regRole === 'ADMIN' ? 'System Administrator' : 'HR Specialist'),
        regEmail,
        regRole,
        regPassword
      );
      // Only HR and staff accounts go to pending queue; Admin accounts are active immediately
      if (regRole !== 'ADMIN' && (res?.status === 'PENDING' || !res?.access_token || !res?.user?.is_active)) {
        setRegisteredPendingInfo({
          name: regFullName || 'HR User',
          email: regEmail,
          role: regRole,
        });
        setLoginEmail(regEmail);
        setIsLoading(false);
        return;
      }
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

  const toggleAuthMode = (targetSignUp: boolean) => {
    setError(null);
    setSuccessMsg(null);
    setRegisteredPendingInfo(null);
    setIsSignUp(targetSignUp);
    navigate(targetSignUp ? '/register' : '/login');
  };

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
        <div className="w-full max-w-5xl glass-card rounded-3xl border border-[#EADBCE]/90 shadow-[0_20px_50px_rgba(120,53,15,0.06)] overflow-hidden relative min-h-[540px] flex flex-col lg:flex-row bg-white/95">

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
                <div
                  className={`mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium ${
                    error.toLowerCase().includes('pending approval') || error.toLowerCase().includes('administrator')
                      ? 'bg-amber-50 border border-amber-300/80 text-amber-900 shadow-sm'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {error.toLowerCase().includes('pending approval') || error.toLowerCase().includes('administrator') ? (
                    <Clock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div>
                    {error.toLowerCase().includes('pending approval') || error.toLowerCase().includes('administrator') ? (
                      <div>
                        <p className="font-bold text-amber-950 text-xs">Account Pending Approval</p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">{error}</p>
                      </div>
                    ) : (
                      <span>{error}</span>
                    )}
                  </div>
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
                      placeholder="user@company.com"
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
              {registeredPendingInfo ? (
                /* Registration Submitted - Pending Approval Screen */
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Clock className="h-7 w-7" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full mb-2">
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      Status: PENDING APPROVAL
                    </span>
                    <h2 className="text-2xl font-black text-[#381E0D] tracking-tight">
                      Registration Received!
                    </h2>
                    <p className="text-xs sm:text-sm text-[#735338] mt-1.5 leading-relaxed">
                      Your HR account has been registered and is awaiting verification by the System Administrator.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF4ED] border border-[#E8D9C8] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E8D9C8]/80 pb-2">
                      <span className="text-[#8C532B] font-semibold">User:</span>
                      <span className="font-bold text-[#381E0D]">{registeredPendingInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#E8D9C8]/80 pb-2">
                      <span className="text-[#8C532B] font-semibold">Email:</span>
                      <span className="font-mono font-bold text-[#381E0D]">{registeredPendingInfo.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C532B] font-semibold">Requested Role:</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                        {registeredPendingInfo.role}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-blue-950">
                      <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                      Administrator Approval Required
                    </p>
                    <p className="text-blue-800 leading-relaxed">
                      Once an Administrator logs in and approves your request under <strong>User Management</strong>, you will be able to sign in with your password.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAuthMode(false)}
                    className="w-full bg-gradient-to-r from-[#8C532B] via-[#9E6237] to-[#7B3F1B] hover:from-[#7B3F1B] hover:to-[#683416] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8C532B]/20 cursor-pointer"
                  >
                    <span>Go to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Registration Form */
                <>
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78350F] bg-[#FAF2E8] border border-[#E8D5C0] px-3 py-1 rounded-full mb-3">
                      <Building2 className="h-3 w-3 text-[#8C532B]" />
                      Get Started
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#381E0D] tracking-tight">
                      Create your workspace
                    </h2>
                    <p className="text-xs sm:text-sm text-[#735338] mt-1">
                      Register your HR account. New registrations will be verified and approved by the Administrator.
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
                          <option value="HR_MANAGER">HR Manager</option>
                          <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
                          <option value="HR_PAYROLL_USER">Payroll Specialist</option>
                          <option value="EMPLOYEE">Employee</option>
                          <option value="ADMIN">Administrator</option>
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
                        <span>Submitting Registration...</span>
                      ) : (
                        <>
                          <span>Submit for Admin Approval</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
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
          {/* SLIDING DECORATIVE OVERLAY                                                */}
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

            {/* Center Highlight */}
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
