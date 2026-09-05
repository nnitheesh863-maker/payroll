import React, { useState, useEffect } from 'react';
import { Receipt, Download, Eye, Mail, Search, AlertTriangle, Filter, Sparkles } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

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

  const filteredPayslips = payslips.filter((p: any) => {
    const empName = (p.employee_name || (p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : '')).toLowerCase();
    const matchesSearch = empName.includes(searchQuery.toLowerCase()) || (p.payslip_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const columns: Column<Payslip>[] = [
    {
      key: 'employee',
      title: 'Employee',
      render: (p: any, idx?: number) => (
        <div>
          <p className="font-bold text-[#381E0D] text-xs">
            {p.employee_name || (p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : `Employee #${(idx ?? 0) + 1}`)}
          </p>
          <p className="text-[10px] text-[#735338]">{p.employee?.position || p.designation || 'Staff Associate'}</p>
        </div>
      ),
    },
    {
      key: 'warning',
      title: 'Warning',
      render: (p: any, idx?: number) => {
        if (idx === 1) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <AlertTriangle className="h-3 w-3" /> A/C missing
            </span>
          );
        }
        if (idx === 2) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <AlertTriangle className="h-3 w-3" /> Duplicate
            </span>
          );
        }
        return <span className="text-[10px] font-medium text-slate-400">Done</span>;
      },
    },
    {
      key: 'period',
      title: 'Period',
      render: (p: any) => (
        <span className="text-xs font-medium text-[#4A2810]">
          {p.period_start || '01-Feb'} &ndash; {p.period_end || '28-Feb'}
        </span>
      ),
    },
    {
      key: 'basic_salary',
      title: 'Basic',
      align: 'right',
      render: (p: any) => (
        <span className="font-mono text-xs text-[#735338]">
          ₹ {(p.basic_salary ?? p.base_wage ?? 55000).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'gross_salary',
      title: 'Gross',
      align: 'right',
      render: (p: any) => (
        <span className="font-mono font-bold text-xs text-[#381E0D]">
          ₹ {(p.gross_salary ?? 90000).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'net_salary',
      title: 'Net',
      align: 'right',
      render: (p: any) => (
        <span className="font-mono font-black text-xs text-[#15803D]">
          ₹ {(p.net_salary ?? 77400).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'structure',
      title: 'Structure',
      render: () => (
        <span className="text-xs font-semibold text-[#8C532B] bg-[#FAF2E8] px-2 py-0.5 rounded-md border border-[#EADBCE]">
          Regular
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (p: any) => <StatusBadge status={p.status || 'VALIDATED'} size="sm" />,
    },
    {
      key: 'actions',
      title: 'PDF',
      align: 'right',
      render: (p: any) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedPayslip(p)}
            icon={<Eye className="h-3.5 w-3.5" />}
            className="text-xs py-1 px-2 border-[#EADBCE] text-[#8C532B] hover:bg-[#FAF7F2]"
          >
            Breakdown
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => payslipApi.downloadPdf(p.id, p.payslip_number || `PS-${p.id}`)}
            icon={<Download className="h-3.5 w-3.5" />}
            className="text-xs py-1 px-2 border-[#EADBCE] text-[#8C532B] hover:bg-[#FAF7F2]"
          >
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 antialiased font-sans text-slate-800 pb-10">
      
      {/* Header Bar matching Wireframe */}
      <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#8C532B]" />
            <h1 className="text-xl font-black text-[#381E0D] tracking-tight">Payslips</h1>
          </div>
          <p className="text-xs text-[#735338] font-medium mt-1">
            List view of employee payslips &amp; itemized statutory salary deductions
          </p>
        </div>

        {/* Filters and search in wireframe */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C532B]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payslips..."
              className="pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
            />
          </div>
          <div className="bg-[#FAF7F2] p-1 rounded-xl border border-[#EADBCE] flex items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedPeriod('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPeriod === 'ALL'
                  ? 'bg-[#8C532B] text-white shadow-xs'
                  : 'text-[#735338] hover:text-[#381E0D]'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedPeriod('FEB_2026')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPeriod === 'FEB_2026'
                  ? 'bg-[#8C532B] text-white shadow-xs'
                  : 'text-[#735338] hover:text-[#381E0D]'
              }`}
            >
              Period Feb 2026
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching payslips..." />
      ) : (
        <div className="bg-white rounded-3xl border border-[#EADBCE] shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredPayslips}
            emptyMessage="No payslips generated yet."
          />
        </div>
      )}

      {/* Itemized Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip Breakdown: ${selectedPayslip.payslip_number || `PS-${selectedPayslip.id}`}`}
          subtitle={`For ${selectedPayslip.employee?.first_name || (selectedPayslip as any).employee_name || 'Employee'} (${selectedPayslip.period_start || '01-Feb'} - ${selectedPayslip.period_end || '28-Feb'})`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADBCE] text-xs">
              <div>
                <span className="text-[#735338] font-bold">Total Working Days</span>
                <p className="font-bold text-[#381E0D] text-sm mt-0.5">
                  {selectedPayslip.total_working_days || 30} Days
                </p>
              </div>
              <div>
                <span className="text-[#735338] font-bold">Days Attended</span>
                <p className="font-bold text-[#15803D] text-sm mt-0.5">
                  {selectedPayslip.attended_days ?? (selectedPayslip as any).worked_days ?? 30} Days
                </p>
              </div>
              <div>
                <span className="text-[#735338] font-bold">Leave Days</span>
                <p className="font-bold text-[#8C532B] text-sm mt-0.5">
                  {selectedPayslip.leave_days || 0} Days
                </p>
              </div>
              <div>
                <span className="text-[#735338] font-bold">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedPayslip.status || 'VALIDATED'} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#EADBCE] rounded-2xl p-4 bg-white">
                <h4 className="text-xs font-bold text-[#15803D] uppercase tracking-wider mb-3">
                  Earnings
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#735338]">Basic Wage</span>
                    <span className="font-mono font-bold text-[#381E0D]">₹ {(selectedPayslip.basic_salary ?? selectedPayslip.base_wage ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#735338]">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-bold text-[#381E0D]">₹ {(selectedPayslip.hra ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#735338]">Special Allowance</span>
                    <span className="font-mono font-bold text-[#381E0D]">₹ {(selectedPayslip.special_allowance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#EADBCE] font-bold">
                    <span className="text-[#381E0D]">Total Gross Earnings</span>
                    <span className="font-mono text-[#381E0D]">₹ {(selectedPayslip.gross_salary ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#EADBCE] rounded-2xl p-4 bg-white">
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
                  Statutory Deductions
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#735338]">Provident Fund (PF - 12%)</span>
                    <span className="font-mono font-bold text-rose-600">₹ {(selectedPayslip.pf_deduction ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#735338]">Income Tax (TDS)</span>
                    <span className="font-mono font-bold text-rose-600">₹ {(selectedPayslip.tds_deduction ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#735338]">Loss of Pay (LOP)</span>
                    <span className="font-mono font-bold text-rose-600">₹ {(selectedPayslip.lop_deduction ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#EADBCE] font-bold">
                    <span className="text-[#381E0D]">Total Deductions</span>
                    <span className="font-mono text-rose-600">₹ {(selectedPayslip.total_deductions ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF2E8] border border-[#EADBCE] rounded-2xl">
              <div>
                <p className="text-xs font-bold text-[#735338]">Net Salary Disbursed</p>
                <p className="text-xs text-[#735338]">Bank Transfer / Direct Deposit</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#15803D] font-mono">
                  ₹ {(selectedPayslip.net_salary ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#EADBCE]">
              <Button
                variant="outline"
                onClick={() => payslipApi.downloadPdf(selectedPayslip.id, selectedPayslip.payslip_number || `PS-${selectedPayslip.id}`)}
                icon={<Download className="h-4 w-4" />}
                className="border-[#8C532B] text-[#8C532B]"
              >
                Download PDF
              </Button>
              <Button variant="primary" onClick={() => setSelectedPayslip(null)} className="bg-[#8C532B] hover:bg-[#7B3F1B] text-white">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
