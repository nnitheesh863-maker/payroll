import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        err?.response?.data?.detail || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: Role) => {
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

  const demoRoles: { role: Role; label: string; email: string; color: string }[] = [
    { role: 'ADMIN', label: 'Admin (Full Access)', email: 'admin@peoplepay360.com', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { role: 'HR_MANAGER', label: 'HR Manager', email: 'hrmanager@peoplepay360.com', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { role: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager', email: 'payrollmanager@peoplepay360.com', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { role: 'HR_PAYROLL_USER', label: 'Payroll Specialist', email: 'payrolluser@peoplepay360.com', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { role: 'EMPLOYEE', label: 'Employee (Self-Service)', email: 'employee@peoplepay360.com', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary-100 selection:text-primary-700">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30 mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          People<span className="text-primary-600">Pay360</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enterprise HR, Payroll & Compensation ERP
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-card">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
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
              <a href="#forgot" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
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

          {/* Quick 1-Click Role Login Panel */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Click Demo Login Personas
            </p>
            <div className="space-y-1.5">
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleQuickLogin(r.role)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${r.color}`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{r.label}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono">{r.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          PeoplePay360 Enterprise ERP &bull; Protected by JWT &amp; RBAC Architecture
        </p>
      </div>
    </div>
  );
};
