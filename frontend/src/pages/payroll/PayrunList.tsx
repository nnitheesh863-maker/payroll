import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Plus, ChevronRight, Calculator, CheckCircle, Clock } from 'lucide-react';
import { payrollApi } from '../../services/payroll.api';
import { Payrun } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const PayrunList: React.FC = () => {
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: 'October 2026 Regular Payrun',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    pay_date: '2026-10-31',
    notes: 'Standard monthly compensation cycle.',
  });

  const { canCreatePayrun } = usePermission();
  const navigate = useNavigate();

  const loadPayruns = async () => {
    setIsLoading(true);
    try {
      const data = await payrollApi.listPayruns();
      setPayruns(data);
    } catch (err) {
      console.error('Failed to load payruns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayruns();
  }, []);

  const handleCreatePayrun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await payrollApi.createPayrun(formData);
      setIsModalOpen(false);
      navigate(`/payroll/${created.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create payrun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Payrun>[] = [
    {
      key: 'batch_number',
      title: 'Batch Code',
      render: (pr) => <span className="font-mono font-bold text-xs text-slate-800">{pr.batch_number}</span>,
    },
    {
      key: 'name',
      title: 'Payrun Cycle',
      render: (pr) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{pr.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {pr.period_start} to {pr.period_end}
          </p>
        </div>
      ),
    },
    {
      key: 'employee_count',
      title: 'Employees',
      align: 'center',
      render: (pr) => <span className="font-semibold text-xs text-slate-700">{pr.employee_count}</span>,
    },
    {
      key: 'total_gross',
      title: 'Gross Total',
      align: 'right',
      render: (pr) => <span className="font-mono text-xs font-semibold text-slate-800">₹ {pr.total_gross.toLocaleString()}</span>,
    },
    {
      key: 'total_net',
      title: 'Net Disbursed',
      align: 'right',
      render: (pr) => <span className="font-mono text-xs font-bold text-emerald-600">₹ {pr.total_net.toLocaleString()}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (pr) => <StatusBadge status={pr.status} size="sm" />,
    },
    {
      key: 'action',
      title: '',
      align: 'right',
      render: (pr) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/payroll/${pr.id}`)}
          icon={<ChevronRight className="h-4 w-4" />}
          className="text-xs py-1 px-2.5"
        >
          View Stepper
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payroll Cycles (Payruns)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process monthly payroll batches, compute attendance rules, and disburse payslips
          </p>
        </div>
        {canCreatePayrun && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create New Payrun
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching payruns..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable
            columns={columns}
            data={payruns}
            onRowClick={(pr) => navigate(`/payroll/${pr.id}`)}
          />
        </div>
      )}

      {/* Create Payrun Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Payrun Batch"
        subtitle="Set the payroll pay period and disbursement date."
      >
        <form onSubmit={handleCreatePayrun} className="space-y-4">
          <Input
            label="Payrun Title"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Period Start Date"
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              required
            />
            <Input
              label="Period End Date"
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              required
            />
          </div>

          <Input
            label="Scheduled Pay Date"
            type="date"
            value={formData.pay_date}
            onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Start Payrun
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
