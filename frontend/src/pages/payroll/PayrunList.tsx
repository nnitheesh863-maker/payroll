import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Plus,
  ChevronRight,
  Calculator,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft,
  Users,
  CheckSquare,
  Square,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { payrollApi } from '../../services/payroll.api';
import { employeeApi } from '../../services/employee.api';
import { Payrun, Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const PayrunList: React.FC = () => {
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1); // 1 = Scope, 2 = Select Employees
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Payrun Scope Form State
  const [scopeData, setScopeData] = useState({
    name: 'February 2026 Regular Payrun',
    pay_structure: 'United States: Regular Pay',
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    pay_date: '2026-02-28',
    notes: 'Standard regular compensation cycle.',
  });

  // Step 2: Employee Selection State
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);

  const { canCreatePayrun } = usePermission();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prList, empList] = await Promise.all([
        payrollApi.listPayruns(),
        employeeApi.list().catch(() => []),
      ]);
      setPayruns(prList);
      
      // Fallback employee list if empty
      if (empList && empList.length > 0) {
        setEmployees(empList);
        setSelectedEmpIds(empList.map((e: any) => e.id));
      } else {
        const mockEmployees: any[] = [
          { id: 1, full_name: 'Anita Oliver', role: 'Staff Accountant', department: 'Finance', start_date: '2024-01-01', wage: 4500, working_hours: '40 hours/week' },
          { id: 2, full_name: 'Audrey Peterson', role: 'HR Coordinator', department: 'HR', start_date: '2024-01-01', wage: 4000, working_hours: '40 hours/week' },
          { id: 3, full_name: 'Billy Kyle', role: 'Junior Engineer', department: 'Engineering', start_date: '2024-09-02', wage: 3100, working_hours: '40 hours/week' },
          { id: 4, full_name: 'Eli Lambert', role: 'Senior Designer', department: 'Design', start_date: '2024-01-01', wage: 4350, working_hours: '40 hours/week' },
          { id: 5, full_name: 'Paul Williams', role: 'DevOps Specialist', department: 'Engineering', start_date: '2024-07-01', wage: 3950, working_hours: '40 hours/week' },
          { id: 6, full_name: 'Aarav Mehta', role: 'Senior Analyst', department: 'Finance', start_date: '2024-01-01', wage: 5200, working_hours: '40 hours/week' },
          { id: 7, full_name: 'Sara Khan', role: 'HR Operations Lead', department: 'HR', start_date: '2024-01-01', wage: 4500, working_hours: '40 hours/week' },
          { id: 8, full_name: 'Anil Patel', role: 'Full Stack Engineer', department: 'Engineering', start_date: '2024-02-01', wage: 4500, working_hours: '40 hours/week' },
        ];
        setEmployees(mockEmployees);
        setSelectedEmpIds(mockEmployees.map((e) => e.id));
      }
    } catch (err) {
      console.error('Failed to load payrun data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenWizard = () => {
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleContinueToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setWizardStep(2);
  };

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === filteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleEmployee = (id: number) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((empId) => empId !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      alert('Please select at least one employee record to create the payrun.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await payrollApi.createPayrun({
        ...scopeData,
        selected_employee_ids: selectedEmpIds,
      });
      setIsWizardOpen(false);
      navigate(`/payroll/${created.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create payrun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = (emp.full_name || `${(emp as any).first_name || ''} ${(emp as any).last_name || ''}`).toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const q = employeeSearch.toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const columns: Column<Payrun>[] = [
    {
      key: 'batch_number',
      title: 'Batch Code',
      render: (pr) => <span className="font-mono font-bold text-xs text-[#381E0D]">{pr.batch_number}</span>,
    },
    {
      key: 'name',
      title: 'Payrun Cycle',
      render: (pr) => (
        <div>
          <p className="font-bold text-[#381E0D] text-xs">{pr.name}</p>
          <p className="text-[11px] text-[#735338] mt-0.5">
            {pr.period_start} to {pr.period_end}
          </p>
        </div>
      ),
    },
    {
      key: 'employee_count',
      title: 'Employees',
      align: 'center',
      render: (pr) => (
        <span className="font-bold text-xs bg-[#FAF7F2] text-[#8C532B] px-2.5 py-0.5 rounded-full border border-[#EADBCE]">
          {pr.employee_count ?? 3} employees
        </span>
      ),
    },
    {
      key: 'total_gross',
      title: 'Gross Total',
      align: 'right',
      render: (pr) => <span className="font-mono text-xs font-semibold text-[#381E0D]">₹ {(pr.total_gross ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'total_net',
      title: 'Net Disbursed',
      align: 'right',
      render: (pr) => <span className="font-mono text-xs font-bold text-[#15803D]">₹ {(pr.total_net ?? 0).toLocaleString()}</span>,
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
          className="text-xs py-1 px-3 border-[#EADBCE] text-[#8C532B] hover:bg-[#FAF7F2]"
        >
          Open Payrun
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 antialiased font-sans text-slate-800 pb-10">
      
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#EADBCE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#8C532B]" />
            <h1 className="text-xl font-black text-[#381E0D] tracking-tight">
              Payroll Cycles (Payruns)
            </h1>
          </div>
          <p className="text-xs text-[#735338] font-medium mt-1">
            Process monthly batches, apply salary structures, and validate disbursements
          </p>
        </div>

        {canCreatePayrun && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleOpenWizard}
            className="bg-[#8C532B] hover:bg-[#7B3F1B] text-white shadow-sm"
          >
            New Pay Run
          </Button>
        )}
      </div>

      {/* Payrun Batches List */}
      {isLoading ? (
        <LoadingSpinner text="Fetching payrun cycles..." />
      ) : (
        <div className="bg-white rounded-3xl border border-[#EADBCE] shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={payruns}
            onRowClick={(pr) => navigate(`/payroll/${pr.id}`)}
          />
        </div>
      )}

      {/* 🌟 2-STEP MODAL WIZARD (Matching Excalidraw Wireframe) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          
          {/* STEP 1: NEW PAY RUN SCOPE */}
          {wizardStep === 1 && (
            <div className="bg-white w-full max-w-lg rounded-3xl border border-[#EADBCE] shadow-2xl p-6 relative animate-scale-up">
              <div className="flex items-center justify-between pb-4 border-b border-[#EADBCE]">
                <div>
                  <h3 className="text-lg font-black text-[#381E0D]">New Pay Run</h3>
                  <p className="text-xs text-[#735338] mt-0.5">Collect payrun scope and active structure</p>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleContinueToStep2} className="space-y-4.5 mt-5">
                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1.5">
                    Payrun Name
                  </label>
                  <input
                    type="text"
                    value={scopeData.name}
                    onChange={(e) => setScopeData({ ...scopeData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] font-semibold focus:outline-none focus:border-[#8C532B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1.5">
                    Pay Structure
                  </label>
                  <select
                    value={scopeData.pay_structure}
                    onChange={(e) => setScopeData({ ...scopeData, pay_structure: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] font-semibold focus:outline-none focus:border-[#8C532B] cursor-pointer"
                  >
                    <option value="United States: Regular Pay">United States: Regular Pay</option>
                    <option value="India: Standard Regular Pay">India: Standard Regular Pay</option>
                    <option value="Executive Leadership Structure">Executive Leadership Structure</option>
                    <option value="Sales & Commission Plan">Sales &amp; Commission Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1.5">
                    Period Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={scopeData.period_start}
                      onChange={(e) => setScopeData({ ...scopeData, period_start: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] font-semibold focus:outline-none focus:border-[#8C532B]"
                    />
                    <input
                      type="date"
                      value={scopeData.period_end}
                      onChange={(e) => setScopeData({ ...scopeData, period_end: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] font-semibold focus:outline-none focus:border-[#8C532B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2810] mb-1.5">
                    Scheduled Pay Date
                  </label>
                  <input
                    type="date"
                    value={scopeData.pay_date}
                    onChange={(e) => setScopeData({ ...scopeData, pay_date: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] font-semibold focus:outline-none focus:border-[#8C532B]"
                  />
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADBCE] text-[11px] text-[#735338]">
                  <p className="font-semibold text-[#8C532B] flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="h-3.5 w-3.5" /> Participant Note:
                  </p>
                  This popup collects the payrun scope only. Clicking <b>Continue</b> will take you to employee selection without creating the payrun yet.
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#EADBCE]">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#735338] hover:text-[#381E0D] cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: SELECT EMPLOYEE RECORDS */}
          {wizardStep === 2 && (
            <div className="bg-white w-full max-w-3xl rounded-3xl border border-[#EADBCE] shadow-2xl p-6 relative animate-scale-up max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#EADBCE]">
                <div>
                  <h3 className="text-lg font-black text-[#381E0D]">Select Employee Records</h3>
                  <p className="text-xs text-[#735338] mt-0.5">
                    Include staff for {scopeData.name} ({scopeData.pay_structure})
                  </p>
                </div>
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Search & Counter Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C532B]/50" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl text-xs text-[#381E0D] focus:outline-none focus:border-[#8C532B]"
                  />
                </div>
                <div className="text-xs font-bold text-[#735338] flex items-center justify-end">
                  <span>
                    Selected: <b className="text-[#8C532B]">{selectedEmpIds.length}</b> / {employees.length}
                  </span>
                </div>
              </div>

              {/* Employee Selection Table */}
              <div className="flex-1 overflow-y-auto border border-[#EADBCE] rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#EADBCE] sticky top-0 z-10 text-[#4A2810] font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="text-[#8C532B] cursor-pointer"
                        >
                          {selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-[#8C532B]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Working Hours</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3 text-right">Wage / Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/60">
                    {filteredEmployees.map((emp: any) => {
                      const isSelected = selectedEmpIds.includes(emp.id);
                      const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`;
                      const hours = emp.working_hours || '40 hours/week';
                      const start = emp.start_date || 'Jan 1';
                      const wageVal = emp.wage ?? emp.basic_salary ?? 4500;

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => handleToggleEmployee(emp.id)}
                          className={`hover:bg-[#FAF7F2] cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#FAF2E8]/40' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-[#8C532B]" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300" />
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-[#381E0D]">{name}</p>
                            <p className="text-[10px] text-[#735338]">{emp.department} &bull; {emp.role || emp.designation}</p>
                          </td>
                          <td className="p-3 text-[#4A2810] font-medium">{hours}</td>
                          <td className="p-3 text-[#735338] font-medium">{start}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#381E0D]">
                            $ {Number(wageVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#EADBCE] text-[11px] text-[#735338] mt-3">
                <p className="font-semibold text-[#8C532B]">Participant note:</p>
                User selects one or more eligible employees, then clicks Create Payrun. The created Payrun contains only the selected employees.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#EADBCE] mt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 text-xs font-bold text-[#735338] hover:text-[#381E0D] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleCreatePayrun}
                  disabled={isSubmitting || selectedEmpIds.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#8C532B] hover:bg-[#7B3F1B] text-white font-bold text-xs shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Generating...' : 'Create Payrun'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
