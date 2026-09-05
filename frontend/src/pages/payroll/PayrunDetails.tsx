import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  DollarSign,
  Send,
  AlertTriangle,
  Download,
  FileCheck,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { payrollApi } from '../../services/payroll.api';
import { payslipApi } from '../../services/payslip.api';
import { Payrun, Payslip } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const PayrunDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const payrunId = Number(id);
  const navigate = useNavigate();

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const { canCreatePayrun, canValidatePayrun, user } = usePermission();

  const loadPayrunDetails = async () => {
    if (!payrunId) return;
    setIsLoading(true);
    try {
      const [pr, psList] = await Promise.all([
        payrollApi.getPayrun(payrunId),
        payrollApi.getPayrunPayslips(payrunId),
      ]);
      setPayrun(pr);
      setPayslips(psList);
    } catch (err) {
      console.error('Failed to load payrun details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayrunDetails();
  }, [payrunId]);

  const handleCompute = async () => {
    setIsProcessing(true);
    try {
      await payrollApi.computePayrun(payrunId);
      await loadPayrunDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Payroll computation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    if (!canValidatePayrun) {
      alert('Validation requires HR_PAYROLL_MANAGER or ADMIN role.');
      return;
    }
    setIsProcessing(true);
    try {
      await payrollApi.validatePayrun(payrunId);
      await loadPayrunDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Payrun validation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!canValidatePayrun) {
      alert('Action requires HR_PAYROLL_MANAGER or ADMIN role.');
      return;
    }
    setIsProcessing(true);
    try {
      await payrollApi.markPaid(payrunId);
      await loadPayrunDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to mark as paid');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendPayslips = async () => {
    setIsProcessing(true);
    try {
      await payrollApi.sendPayslips(payrunId);
      alert('All employee payslips have been dispatched via email with attached ReportLab PDFs!');
      await loadPayrunDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send payslips');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading payrun stepper & calculations..." />;
  }

  if (!payrun) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Payrun cycle not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/payroll')} className="mt-3">
          Back to Payruns
        </Button>
      </div>
    );
  }

  const steps = [
    { key: 'DRAFT', label: '1. Draft & Batch Created', icon: FileCheck },
    { key: 'COMPUTED', label: '2. Computed by Engine', icon: Calculator },
    { key: 'VALIDATED', label: '3. Manager Validated', icon: CheckCircle2 },
    { key: 'PAID', label: '4. Disbursed & Paid', icon: DollarSign },
    { key: 'SENT', label: '5. Payslips Emailed', icon: Send },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'COMPUTED':
        return 1;
      case 'VALIDATED':
        return 2;
      case 'PAID':
        return 3;
      case 'SENT':
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(payrun.status);

  const columns: Column<Payslip>[] = [
    {
      key: 'employee',
      title: 'Employee',
      render: (p: any) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">
            {p.employee_name || (p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : `EMP #${p.employee_id}`)}
          </p>
          <p className="font-mono text-[11px] text-slate-400">{p.payslip_number || p.employee_code || `PS-${p.id}`}</p>
        </div>
      ),
    },
    {
      key: 'working_days',
      title: 'Attendance',
      render: (p: any) => (
        <span className="text-xs text-slate-600">
          {p.attended_days ?? p.worked_days ?? 30} / {p.total_working_days ?? 30}d {(p.unpaid_leave_days ?? p.leave_days ?? 0) > 0 && <span className="text-rose-600 font-semibold">(LOP: {p.unpaid_leave_days ?? p.leave_days}d)</span>}
        </span>
      ),
    },
    {
      key: 'base_wage',
      title: 'Base Wage',
      align: 'right',
      render: (p: any) => <span className="font-mono text-xs text-slate-700">₹ {(p.base_wage ?? p.basic_salary ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'gross_salary',
      title: 'Gross Salary',
      align: 'right',
      render: (p: any) => <span className="font-mono font-semibold text-xs text-slate-900">₹ {(p.gross_salary ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'total_deductions',
      title: 'Deductions (PF/TDS/LOP)',
      align: 'right',
      render: (p: any) => <span className="font-mono text-xs text-rose-600 font-semibold">₹ {(p.total_deductions ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'net_salary',
      title: 'Net Salary Disbursed',
      align: 'right',
      render: (p: any) => <span className="font-mono text-xs font-bold text-emerald-600">₹ {(p.net_salary ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'action',
      title: 'Payslip PDF',
      align: 'right',
      render: (p: any) => (
        <Button
          size="sm"

          variant="outline"
          onClick={() => payslipApi.downloadPdf(p.id, p.payslip_number)}
          icon={<Download className="h-3 w-3" />}
          className="text-xs py-1 px-2.5"
        >
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/payroll')}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Payrun Batches</span>
      </button>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{payrun.name}</h1>
              <StatusBadge status={payrun.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Batch Code: <span className="font-mono font-bold text-slate-700">{payrun.batch_number}</span> &bull; Period: {payrun.period_start} to {payrun.period_end}
            </p>
          </div>

          {/* Stepper Workflow Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {payrun.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={handleCompute}
                isLoading={isProcessing}
                icon={<Calculator className="h-4 w-4" />}
              >
                Compute Payroll Engine
              </Button>
            )}

            {payrun.status === 'COMPUTED' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCompute}
                  isLoading={isProcessing}
                  icon={<Calculator className="h-4 w-4" />}
                >
                  Re-Compute
                </Button>
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  isLoading={isProcessing}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Validate Payrun (Manager Sign-off)
                </Button>
              </>
            )}

            {payrun.status === 'VALIDATED' && (
              <Button
                variant="success"
                onClick={handleMarkPaid}
                isLoading={isProcessing}
                icon={<DollarSign className="h-4 w-4" />}
              >
                Disburse &amp; Mark Paid
              </Button>
            )}

            {payrun.status === 'PAID' && (
              <Button
                variant="primary"
                onClick={handleSendPayslips}
                isLoading={isProcessing}
                icon={<Send className="h-4 w-4" />}
              >
                Dispatch Payslip Emails &amp; PDFs
              </Button>
            )}
          </div>
        </div>

        {/* Multi-Step Flow Visualizer */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              let stepStyle = 'bg-slate-50 text-slate-400 border-slate-200';
              if (isCurrent) {
                stepStyle = 'bg-primary-50 text-primary-700 border-primary-300 font-semibold ring-1 ring-primary-500';
              } else if (isPast) {
                stepStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
              }

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs transition-all ${stepStyle}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial Summary Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Employees
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{payrun.employee_count}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Gross Payroll
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            ₹ {payrun.total_gross.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Deductions
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            ₹ {payrun.total_deductions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Net Disbursed
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
            ₹ {payrun.total_net.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Itemized Computed Payslips Table */}
      <Card
        title={`Computed Employee Payslips (${payslips.length})`}
        subtitle="Individual salary ledger generated via PeoplePay360 rule calculations"
        noPadding
      >
        <DataTable
          columns={columns}
          data={payslips}
          emptyMessage="No payslips computed yet. Click 'Compute Payroll Engine' above."
        />
      </Card>
    </div>
  );
};
