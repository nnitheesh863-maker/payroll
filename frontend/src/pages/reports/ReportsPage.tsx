import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  Printer,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { pdfReports } from '../../utils/pdfGenerator';

export const ReportsPage: React.FC = () => {
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const reportCards = [
    {
      id: 'payroll-master',
      title: 'Monthly Payroll Master Summary',
      desc: 'Complete ledger of gross salary, allowances, PF, TDS, Professional Tax, and net disbursements for active pay cycles.',
      icon: FileSpreadsheet,
      format: 'Excel / CSV / PDF',
      color: 'bg-[#FAF2E8] text-[#8C532B] border-[#E8D5C0]',
      exportPdf: () => pdfReports.exportMonthlyPayrollMaster('September 2026 Regular Payrun'),
      sampleStats: [
        { label: 'Active Employees', value: '48 Staff' },
        { label: 'Gross Disbursed', value: '₹ 4,82,950' },
        { label: 'Net Disbursed', value: '₹ 4,14,540' },
      ],
    },
    {
      id: 'pf-esi',
      title: 'Statutory Compliance & PF/ESI Ledger',
      desc: 'Provident Fund (Employee 12% + Employer 12%) and ESI deduction schedule for statutory compliance filing.',
      icon: ShieldCheck,
      format: 'Government ECR Format (PDF / CSV)',
      color: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      exportPdf: () => pdfReports.exportStatutoryCompliance(),
      sampleStats: [
        { label: 'Establishment ID', value: 'MH/BAN/0094821' },
        { label: 'EPF Remittance', value: '₹ 30,000' },
        { label: 'Status', value: 'Audit Ready' },
      ],
    },
    {
      id: 'tds-statement',
      title: 'TDS & Tax Deduction at Source Statement',
      desc: 'Income tax deductions deducted across employee tax tiers and quarterly withholding schedule.',
      icon: BarChart3,
      format: 'Form 24Q Compatible (PDF)',
      color: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      exportPdf: () => pdfReports.exportTdsStatement(),
      sampleStats: [
        { label: 'TAN Number', value: 'BLRP09281A' },
        { label: 'Quarter', value: 'Q2 (FY 2026-27)' },
        { label: 'TDS Remitted', value: '₹ 38,410' },
      ],
    },
    {
      id: 'dept-headcount',
      title: 'Department-wise Headcount & Compensation Cost',
      desc: 'Breakdown of salary expenditure, average CTC, and headcount distribution across Engineering, HR, Finance, etc.',
      icon: PieChart,
      format: 'Executive Summary PDF',
      color: 'bg-[#F7EFE4] text-[#78350F] border-[#E2CEB9]',
      exportPdf: () => pdfReports.exportDepartmentHeadcount(),
      sampleStats: [
        { label: 'Departments', value: '4 Business Units' },
        { label: 'Largest Team', value: 'Engineering (22)' },
        { label: 'Avg Monthly CTC', value: '₹ 1,00,614' },
      ],
    },
  ];

  const handleExportPdf = (report: (typeof reportCards)[0]) => {
    setIsExporting(report.id);
    setTimeout(() => {
      try {
        report.exportPdf();
      } catch (err) {
        console.error('PDF export failed:', err);
      } finally {
        setIsExporting(null);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 antialiased font-sans text-slate-800 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-[#8C532B]" />
            <h1 className="text-xl font-black text-[#381E0D] tracking-tight">
              Reports &amp; Statutory Compliance
            </h1>
          </div>
          <p className="text-xs text-[#735338] font-medium mt-1">
            Audit-ready payroll summaries, tax statements, and statutory filings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Tax &amp; Statutory Compliant
          </span>
        </div>
      </div>

      {/* 4 Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((r) => {
          const Icon = r.icon;
          const isCurrentExporting = isExporting === r.id;

          return (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs hover:shadow-md hover:border-[#8C532B]/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-2xl ${r.color} flex items-center justify-center shrink-0 border shadow-2xs`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-[#381E0D] tracking-tight">{r.title}</h3>
                    <p className="text-xs text-[#735338] mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                {/* Key Summary Stats Strip */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] text-center">
                  {r.sampleStats.map((stat, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] font-bold text-[#735338] uppercase block">
                        {stat.label}
                      </span>
                      <p className="text-xs font-black text-[#381E0D] mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#EADBCE]">
                <span className="text-[11px] font-mono text-[#8C532B]/70 font-bold">
                  Format: {r.format}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleExportPdf(r)}
                    isLoading={isCurrentExporting}
                    icon={<Download className="h-3.5 w-3.5" />}
                    className="text-xs py-1.5 px-3.5 bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold shadow-xs cursor-pointer"
                  >
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
