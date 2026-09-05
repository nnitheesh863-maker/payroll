import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Sparkles, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const { login, quickLoginAsRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Invalid credentials. Please verify your work email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: Role, roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
    setIsLoading(true);
    try {
      await quickLoginAsRole(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Could not connect to backend server. Ensure backend is running.');
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
      color: 'bg-purple-900/30 text-purple-200 border-purple-700/50 hover:bg-purple-800/40',
      desc: 'Universal management & full system access'
    },
    {
      role: 'HR_MANAGER',
      label: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'HrManager@123',
      color: 'bg-blue-900/30 text-blue-200 border-blue-700/50 hover:bg-blue-800/40',
      desc: 'Employee directory & leave approvals'
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      label: 'Payroll Manager',
      email: 'payrollmanager@peoplepay360.com',
      pass: 'PayrollManager@123',
      color: 'bg-emerald-900/30 text-emerald-200 border-emerald-700/50 hover:bg-emerald-800/40',
      desc: 'Validate payruns & disburse salaries'
    },
    {
      role: 'HR_PAYROLL_USER',
      label: 'Payroll Specialist',
      email: 'payrolluser@peoplepay360.com',
      pass: 'PayrollUser@123',
      color: 'bg-amber-900/30 text-amber-200 border-amber-700/50 hover:bg-amber-800/40',
      desc: 'Salary structures & compute engine'
    },
    {
      role: 'EMPLOYEE',
      label: 'Employee (Self-Service)',
      email: 'employee@peoplepay360.com',
      pass: 'Employee@123',
      color: 'bg-slate-800/60 text-slate-200 border-slate-700 hover:bg-slate-800',
      desc: 'Punch attendance & view payslips'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative font-sans text-slate-100 antialiased">
      {/* Visual Accent Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Main HR Portal Card matching Wireframe */}
        <div className="bg-[#181B25] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Card Top Header / Badge */}
          <div className="px-6 py-3.5 bg-[#14161F] border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-200 tracking-wide">
                HR Portal
              </span>
            </div>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full">
              Enterprise v2.4
            </span>
          </div>

          <div className="p-6 sm:p-8">
            {/* Welcome Heading & Subtitle */}
            <div className="mb-6 text-left">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome
              </h2>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                Sign in to continue to your account
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 flex items-start gap-2.5 text-rose-300 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
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
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Wireframe Text Notices */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Accounts are created by an administrator.
              </p>
              <div className="p-3 rounded-xl bg-[#11131C] border border-slate-800 text-slate-300 text-xs font-normal leading-relaxed text-left flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  After sign-in, show only the entities and actions allowed by the user's assigned role.
                </span>
              </div>
            </div>

            {/* 🌟 1-Click Role Switcher Demo Panel */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Sign-In by Assigned Role
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">5 RBAC Roles</span>
              </div>

              <div className="space-y-2">
                {demoRoles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleQuickLogin(r.role, r.email, r.pass)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${r.color}`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <UserCheck className="h-4 w-4 shrink-0 opacity-80" />
                      <div>
                        <p className="font-bold leading-none">{r.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-90 shrink-0 bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">
                      Sign In &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Flow Label */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <span>Successful sign in</span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">Redirects to Role-Filtered Dashboard</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
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
                <p className="text-xs text-slate-400">Security & Account Policy</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-slate-800 text-xs text-slate-300 space-y-2 mb-5">
              <p className="font-semibold text-slate-200">
                Accounts are created and managed by an administrator.
              </p>
              <p>
                To reset or recover your password, please contact your system administrator or HR Manager directly with your work email ID.
              </p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

