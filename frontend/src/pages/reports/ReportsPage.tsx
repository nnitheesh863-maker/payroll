import React from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart, ShieldCheck, Printer } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ReportsPage: React.FC = () => {
  const reportCards = [
    {
      title: 'Monthly Payroll Master Summary',
      desc: 'Complete ledger of gross salary, allowances, PF, TDS, Professional Tax, and net disbursements for active pay cycles.',
      icon: FileSpreadsheet,
      format: 'Excel / CSV / PDF',
    },
    {
      title: 'Statutory Compliance & PF/ESI Ledger',
      desc: 'Provident Fund (Employee 12% + Employer 12%) and ESI deduction schedule for statutory compliance filing.',
      icon: ShieldCheck,
      format: 'Government ECR Format',
    },
    {
      title: 'TDS & Tax Deduction at Source Statement',
      desc: 'Income tax deductions deducted across employee tax tiers and quarterly withholding schedule.',
      icon: BarChart3,
      format: 'Form 24Q Compatible',
    },
    {
      title: 'Department-wise Headcount & Compensation Cost',
      desc: 'Breakdown of salary expenditure, average CTC, and headcount distribution across Engineering, HR, Finance, etc.',
      icon: PieChart,
      format: 'Executive Summary PDF',
    },
  ];

  const handleExport = (reportName: string) => {
    alert(`Exporting ${reportName} in CSV/PDF format...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports &amp; Statutory Compliance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready payroll summaries, tax statements, and statutory filings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((r, i) => {
          const Icon = r.icon;
          return (
            <Card key={i} className="hover:shadow-card transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      Format: {r.format}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(r.title)}
                      icon={<Download className="h-3.5 w-3.5" />}
                      className="text-xs py-1 px-3"
                    >
                      Export Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
