import React, { useState, useEffect } from 'react';
import { Receipt, Download, Eye, Mail, Search } from 'lucide-react';
import { payslipApi } from '../../services/payslip.api';
import { Payslip } from '../../types';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const PayslipList: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const loadPayslips = async () => {
    setIsLoading(true);
    try {
      const data = await payslipApi.list();
      setPayslips(data);
    } catch (err) {
      console.error('Failed to load payslips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handleSendEmail = async (id: number) => {
    try {
      const res = await payslipApi.sendEmail(id);
      alert(res.message);
      await loadPayslips();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to dispatch email');
    }
  };

  const columns: Column<Payslip>[] = [
    {
      key: 'payslip_number',
      title: 'Payslip ID',
      render: (p) => <span className="font-mono font-bold text-xs text-slate-800">{p.payslip_number}</span>,
    },
    {
      key: 'employee',
      title: 'Employee',
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">
            {p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : `EMP #${p.employee_id}`}
          </p>
          <p className="text-[11px] text-slate-400">{p.employee?.position || 'Associate'}</p>
        </div>
      ),
    },
    {
      key: 'period',
      title: 'Pay Period',
      render: (p) => <span className="text-xs text-slate-600">{p.period_start} to {p.period_end}</span>,
    },
    {
      key: 'gross_salary',
      title: 'Gross Salary',
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-slate-800">₹ {p.gross_salary.toLocaleString()}</span>,
    },
    {
      key: 'total_deductions',
      title: 'Deductions',
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-rose-600">₹ {p.total_deductions.toLocaleString()}</span>,
    },
    {
      key: 'net_salary',
      title: 'Net Disbursed',
      align: 'right',
      render: (p) => <span className="font-mono font-bold text-xs text-emerald-600">₹ {p.net_salary.toLocaleString()}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedPayslip(p)}
            icon={<Eye className="h-3.5 w-3.5" />}
            className="text-xs py-1 px-2"
          >
            Breakdown
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => payslipApi.downloadPdf(p.id, p.payslip_number)}
            icon={<Download className="h-3.5 w-3.5" />}
            className="text-xs py-1 px-2"
          >
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payslip Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Itemized employee compensation ledger and official ReportLab PDF documents
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching payslips..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable columns={columns} data={payslips} emptyMessage="No payslips generated yet." />
        </div>
      )}

      {/* Itemized Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip Breakdown: ${selectedPayslip.payslip_number}`}
          subtitle={`For ${selectedPayslip.employee?.first_name} ${selectedPayslip.employee?.last_name} (${selectedPayslip.period_start} - ${selectedPayslip.period_end})`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400">Total Working Days</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPayslip.total_working_days} days</p>
              </div>
              <div>
                <span className="text-slate-400">Attended Days</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPayslip.attended_days} days</p>
              </div>
              <div>
                <span className="text-slate-400">Unpaid Leaves</span>
                <p className="font-bold text-rose-600 mt-0.5">{selectedPayslip.unpaid_leave_days} days (LOP)</p>
              </div>
              <div>
                <span className="text-slate-400">Base Wage (CTC)</span>
                <p className="font-bold text-primary-600 mt-0.5 font-mono">₹ {selectedPayslip.base_wage.toLocaleString()}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Component</th>
                    <th className="py-2.5 px-3 text-left">Category</th>
                    <th className="py-2.5 px-3 text-right">Rate / %</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPayslip.lines_json ? (
                    JSON.parse(selectedPayslip.lines_json).map((line: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">{line.name}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {line.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">{line.rate_or_percentage}</td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold ${line.category === 'DEDUCTION' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {line.category === 'DEDUCTION' ? '-' : ''}₹ {line.amount?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No line items parsed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Net Pay Highlight */}
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-primary-800">NET DISBURSED COMPENSATION</span>
                <p className="text-[11px] text-primary-600">Calculated via PeoplePay360 formula pipeline</p>
              </div>
              <span className="text-xl font-extrabold text-primary-700 font-mono">
                ₹ {selectedPayslip.net_salary.toLocaleString()}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleSendEmail(selectedPayslip.id)}
                icon={<Mail className="h-3.5 w-3.5" />}
              >
                Send via Email
              </Button>
              <Button
                variant="primary"
                onClick={() => payslipApi.downloadPdf(selectedPayslip.id, selectedPayslip.payslip_number)}
                icon={<Download className="h-3.5 w-3.5" />}
              >
                Download Official PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
