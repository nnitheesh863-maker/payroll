import React, { useState, useEffect } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { timeOffApi } from '../../services/timeoff.api';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const TimeOffPage: React.FC = () => {
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type_id: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days_count: 1,
    reason: '',
  });

  const { canApproveLeaves, isEmployee } = usePermission();

  const loadTimeOffData = async () => {
    setIsLoading(true);
    try {
      const [tList, aList, rList] = await Promise.all([
        timeOffApi.getTypes(),
        timeOffApi.getAllocations(),
        timeOffApi.getRequests(),
      ]);
      setTypes(tList);
      setAllocations(aList);
      setRequests(rList);
      if (tList.length > 0) {
        setFormData((prev) => ({ ...prev, leave_type_id: tList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load time off data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeOffData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await timeOffApi.submitRequest(formData);
      setIsApplyModalOpen(false);
      setFormData({
        ...formData,
        reason: '',
        days_count: 1,
      });
      await loadTimeOffData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to apply for leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await timeOffApi.approveRequest(id);
      await loadTimeOffData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    try {
      await timeOffApi.rejectRequest(id, reason);
      await loadTimeOffData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reject request');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  const columns: Column<TimeOffRequest>[] = [
    {
      key: 'employee',
      title: 'Employee',
      render: (r) => (
        <span className="font-semibold text-slate-800 text-xs">
          {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : `EMP #${r.employee_id}`}
        </span>
      ),
    },
    {
      key: 'leave_type',
      title: 'Type',
      render: (r) => <span className="text-xs font-medium text-slate-700">{r.leave_type?.name || 'Leave'}</span>,
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {r.start_date} &rarr; {r.end_date} ({r.days_count}d)
        </span>
      ),
    },
    { key: 'reason', title: 'Reason', render: (r) => <span className="text-xs text-slate-500">{r.reason}</span> },
    { key: 'status', title: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    {
      key: 'action',
      title: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status === 'PENDING' && canApproveLeaves) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(r.id)}
                icon={<Check className="h-3 w-3" />}
                className="py-1 px-2 text-xs"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(r.id)}
                icon={<X className="h-3 w-3" />}
                className="py-1 px-2 text-xs"
              >
                Reject
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">&bull;&bull;&bull;</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Time Off &amp; Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual leave balances, casual requests, and HR manager approval workflow
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsApplyModalOpen(true)}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allocations.map((a) => (
          <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {a.leave_type?.name || 'Leave Type'}
            </span>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-slate-900">{a.remaining_days}</span>
              <span className="text-xs text-slate-400">/ {a.allocated_days} days left</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (a.used_days / (a.allocated_days || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{a.used_days} days utilized in 2026</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals Review for HR / Admin */}
      {canApproveLeaves && pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              {pendingRequests.length} Leave Request(s) Pending Your Decision
            </h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : `EMP #${req.employee_id}`}{' '}
                    &bull; <span className="font-normal text-slate-600">{req.leave_type?.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {req.start_date} to {req.end_date} ({req.days_count} days) &bull; <i>"{req.reason}"</i>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApprove(req.id)}
                    icon={<Check className="h-3.5 w-3.5" />}
                    className="py-1 px-3 text-xs"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReject(req.id)}
                    icon={<X className="h-3.5 w-3.5" />}
                    className="py-1 px-3 text-xs"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests History Table */}
      {isLoading ? (
        <LoadingSpinner text="Fetching leave history..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable columns={columns} data={requests} emptyMessage="No leave requests filed yet." />
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a time-off request for HR approval."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Type"
            value={formData.leave_type_id}
            onChange={(e) => setFormData({ ...formData, leave_type_id: Number(e.target.value) })}
            options={types.map((t) => ({ value: t.id, label: t.name }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Number of Days"
            type="number"
            step="0.5"
            min="0.5"
            value={formData.days_count}
            onChange={(e) => setFormData({ ...formData, days_count: Number(e.target.value) })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Leave
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide details regarding your leave request..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
