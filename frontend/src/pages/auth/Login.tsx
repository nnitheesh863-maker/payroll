import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        err?.response?.data?.detail || 'Invalid credentials. Please use the 1-Click Role Login buttons below or verify email.'
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
      color: 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
      desc: 'Universal management & user access'
    },
    {
      role: 'HR_MANAGER',
      label: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'HrManager@123',
      color: 'bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
      desc: 'Employee hub & leave approvals'
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      label: 'Payroll Manager',
      email: 'payrollmanager@peoplepay360.com',
      pass: 'PayrollManager@123',
      color: 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300',
      desc: 'Validate payruns, approve & send PDFs'
    },
    {
      role: 'HR_PAYROLL_USER',
      label: 'Payroll Specialist',
      email: 'payrolluser@peoplepay360.com',
      pass: 'PayrollUser@123',
      color: 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
      desc: 'Salary rules & calculation engine'
    },
    {
      role: 'EMPLOYEE',
      label: 'Employee (Self-Service)',
      email: 'employee@peoplepay360.com',
      pass: 'Employee@123',
      color: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
      desc: 'Punch attendance & view payslips'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-primary-100 selection:text-primary-700">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30 mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          People<span className="text-primary-600">Pay360</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Enterprise HR, Payroll &amp; Compensation ERP
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@peoplepay360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2"
                />
                Remember me
              </label>
              <span className="text-xs text-slate-400">
                Demo Mode Active
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to PeoplePay360
            </Button>
          </form>

          {/* 🌟 1-Click Role Login Panel */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                1-Click Demo Login Personas
              </p>
            </div>
            <div className="space-y-2">
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleQuickLogin(r.role, r.email, r.pass)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-xs ${r.color}`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <UserCheck className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-bold leading-none">{r.label}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono opacity-80 shrink-0 bg-white/70 px-2 py-0.5 rounded border border-current/10">
                    Sign In &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          PeoplePay360 Enterprise ERP &bull; Protected by JWT &amp; 5-Tier RBAC Architecture
        </p>
      </div>
    </div>
  );
};
