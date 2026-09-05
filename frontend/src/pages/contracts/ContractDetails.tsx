import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Info,
  FileCheck,
  Building2,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { contractApi } from '../../services/contract.api';
import { Contract } from '../../types';
import { Button } from '../../components/common/Button';

const WIREFRAME_CONTRACT_42: Contract = {
  id: 42,
  contract_code: 'CON/2026/0042',
  employee_id: 1,
  contract_title: 'Payroll Specialist Employment Contract',
  contract_type: 'FULL_TIME',
  start_date: '01-Jan-2026',
  end_date: '-',
  wage: 85000,
  working_hours_per_week: 40,
  status: 'Running',
  salary_structure_name: 'Employee Salary',
  notes: 'This running contract is the source for payroll calculation in the active period.',
  employee: {
    id: 1,
    emp_code: 'EMP-001',
    first_name: 'Aarav',
    last_name: 'Mehta',
    department: 'Finance',
    position: 'Payroll Specialist',
    email: 'aarav@exp.com',
  },
};

export const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contractId = Number(id) || 42;

  const [contract, setContract] = useState<Contract>(WIREFRAME_CONTRACT_42);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contract>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadContractData = async () => {
      if (!contractId) return;
      setIsLoading(true);
      try {
        const c = await contractApi.getById(contractId);
        if (c) {
          setContract({
            ...c,
            contract_code: c.contract_code || `CON/2026/${String(c.id).padStart(4, '0')}`,
            status: (c.status === 'ACTIVE' ? 'Running' : c.status) as any,
          });
        }
      } catch (e) {
        console.log('Using wireframe contract detail state');
      } finally {
        setIsLoading(false);
      }
    };
    loadContractData();
  }, [contractId]);

  const handleStartEdit = () => {
    setEditForm({ ...contract });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const updated = { ...contract, ...editForm };
    setContract(updated);
    setIsEditing(false);
    try {
      await contractApi.update(contractId, editForm);
    } catch (e) {
      console.log('Saved to local contract state');
    }
  };

  const isRunning = contract.status === 'Running' || contract.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top Header Breadcrumb & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Contracts</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Contract / {contract.contract_code || 'CON/2026/0042'}</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Form view of one contract
          </p>
        </div>

        {/* Action Bar */}
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<X className="h-4 w-4" />}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-4 w-4" />}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={handleStartEdit}
              className="bg-white border-slate-300 font-bold text-slate-800 hover:bg-slate-50"
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Contract Detail Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-lg flex items-center justify-center shadow-inner shrink-0">
            <FileCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {contract.contract_code || 'CON/2026/0042'}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {isRunning ? 'Running' : 'Expired'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Employee:{' '}
              <span className="text-white font-bold">
                {contract.employee?.first_name || 'Aarav'} {contract.employee?.last_name || 'Mehta'}
              </span>{' '}
              ({contract.employee?.department || 'Finance'})
            </p>
          </div>
        </div>

        <div className="text-left md:text-right bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Monthly Base Wage
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            ₹{contract.wage ? contract.wage.toLocaleString() : '85,000'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Form Fields Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
          Contract Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-xs">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Employee</label>
              <p className="font-bold text-slate-900 text-sm">
                {contract.employee?.first_name || 'Aarav'} {contract.employee?.last_name || 'Mehta'}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm">{contract.start_date || '01-Jan-2026'}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">End Date</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm">{contract.end_date || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Status</label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold ${
                    isRunning
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isRunning ? 'Running' : 'Expired'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department</label>
              <p className="font-bold text-slate-900 text-sm">
                {contract.employee?.department || 'Finance'}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Job Position</label>
              <p className="font-bold text-slate-900 text-sm">
                {contract.employee?.position || 'Payroll Specialist'}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Wage / Month</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editForm.wage || 85000}
                  onChange={(e) => setEditForm({ ...editForm, wage: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm font-mono">
                  ₹{contract.wage ? contract.wage.toLocaleString() : '85,000'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Working Schedule</label>
              <p className="font-bold text-slate-900 text-sm">40 hours / week</p>
            </div>
          </div>
        </div>

        {/* Salary Structure / Notes Box Section */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Salary Structure / Notes</span>
            </h4>

            <div className="text-xs space-y-2">
              <p className="text-slate-300">
                Structure Type:{' '}
                <span className="font-bold text-white underline decoration-primary-500">
                  {contract.salary_structure_name || 'Employee Salary'}
                </span>
              </p>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-slate-200 italic font-medium">
                "{contract.notes || 'This running contract is the source for payroll calculation in the active period.'}"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Note Footer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="italic">
          Useful note: for the problem statement, one employee should not have multiple Running contracts for the same period.
        </p>
      </div>
    </div>
  );
};
