import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { contractApi } from '../../services/contract.api';
import { employeeApi } from '../../services/employee.api';
import { Contract, Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

const WIREFRAME_CONTRACTS: Contract[] = [
  {
    id: 42,
    contract_code: 'CON/2026/0042',
    employee_id: 1,
    contract_title: 'Payroll Specialist Contract',
    contract_type: 'FULL_TIME',
    start_date: '01-Jan-26',
    end_date: '-',
    wage: 85000,
    working_hours_per_week: 40,
    status: 'Running',
    salary_structure_name: 'Employee Salary',
    employee: {
      id: 1,
      emp_code: 'EMP-001',
      first_name: 'Aarav',
      last_name: 'Mehta',
      department: 'Finance',
      position: 'Payroll Specialist',
    },
  },
  {
    id: 11,
    contract_code: 'CON/2026/0011',
    employee_id: 1,
    contract_title: 'Junior Associate Agreement',
    contract_type: 'FULL_TIME',
    start_date: '01-Jul-25',
    end_date: '31-Dec-25',
    wage: 75000,
    working_hours_per_week: 40,
    status: 'Expired',
    salary_structure_name: 'Employee Salary',
    employee: {
      id: 1,
      emp_code: 'EMP-001',
      first_name: 'Aarav',
      last_name: 'Mehta',
      department: 'Finance',
      position: 'Payroll Specialist',
    },
  },
  {
    id: 10,
    contract_code: 'CON/2026/0010',
    employee_id: 2,
    contract_title: 'HR Officer Employment Contract',
    contract_type: 'FULL_TIME',
    start_date: '01-Jan-26',
    end_date: '-',
    wage: 90000,
    working_hours_per_week: 40,
    status: 'Running',
    salary_structure_name: 'Employee Salary',
    employee: {
      id: 2,
      emp_code: 'EMP-002',
      first_name: 'Sara',
      last_name: 'Khan',
      department: 'HR',
      position: 'HR Officer',
    },
  },
];

export const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canManageContracts } = usePermission();

  const empFilterId = searchParams.get('employee_id');

  const [contracts, setContracts] = useState<Contract[]>(WIREFRAME_CONTRACTS);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: 1,
    contract_title: 'Full-Time Employment Contract',
    contract_type: 'FULL_TIME',
    start_date: '2026-01-01',
    end_date: '',
    wage: 85000,
    working_hours_per_week: 40,
    salary_structure_id: 1,
    status: 'Running' as const,
  });

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const data = await contractApi.list();
      if (data && data.length > 0) {
        // Merge API contracts with wireframe samples
        const mergedMap = new Map<string, Contract>();
        WIREFRAME_CONTRACTS.forEach((c) => mergedMap.set(c.contract_code || `CON-${c.id}`, c));
        data.forEach((c) => {
          const code = c.contract_code || `CON/2026/${String(c.id).padStart(4, '0')}`;
          mergedMap.set(code, {
            ...c,
            contract_code: code,
            status: (c.status === 'ACTIVE' ? 'Running' : c.status) as any,
          });
        });
        setContracts(Array.from(mergedMap.values()));
      }
    } catch (e) {
      console.log('Using default wireframe contracts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const filteredContracts = contracts.filter((c) => {
    // If filtered by employee_id URL param
    if (empFilterId && Number(empFilterId) !== c.employee_id) {
      return false;
    }

    const empName = c.employee
      ? `${c.employee.first_name || ''} ${c.employee.last_name || ''}`.toLowerCase()
      : '';
    const code = (c.contract_code || '').toLowerCase();
    const title = (c.contract_title || '').toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      code.includes(searchLower) || empName.includes(searchLower) || title.includes(searchLower);

    if (!matchesSearch) return false;

    if (activeFilter === 'Running') return c.status === 'Running' || c.status === 'ACTIVE';
    if (activeFilter === 'Expired') return c.status === 'Expired' || c.status === 'EXPIRED';

    return true;
  });

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await contractApi.create(formData as any);
      setIsModalOpen(false);
      await loadContracts();
      if (created?.id) {
        navigate(`/contracts/${created.id}`);
      }
    } catch (err) {
      // Local add fallback
      const newCode = `CON/2026/00${contracts.length + 10}`;
      const newC: Contract = {
        id: Date.now(),
        contract_code: newCode,
        ...formData,
        status: 'Running',
        employee: {
          id: formData.employee_id,
          first_name: 'Aarav',
          last_name: 'Mehta',
        },
      };
      setContracts((prev) => [newC, ...prev]);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Contract>[] = [
    {
      key: 'contract',
      title: 'Contract',
      render: (c) => (
        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
          {c.contract_code || `CON/2026/00${c.id}`}
        </span>
      ),
    },
    {
      key: 'employee',
      title: 'Employee',
      render: (c) => {
        const empName = c.employee
          ? `${c.employee.first_name || ''} ${c.employee.last_name || ''}`
          : c.employee_id === 1
          ? 'Aarav Mehta'
          : c.employee_id === 2
          ? 'Sara Khan'
          : `EMP #${c.employee_id}`;
        return <span className="font-bold text-slate-900 text-xs">{empName}</span>;
      },
    },
    {
      key: 'start_date',
      title: 'Start',
      render: (c) => <span className="text-xs text-slate-600 font-medium">{c.start_date}</span>,
    },
    {
      key: 'end_date',
      title: 'End',
      render: (c) => <span className="text-xs text-slate-500 font-medium">{c.end_date || '-'}</span>,
    },
    {
      key: 'wage',
      title: 'Wage / Month',
      render: (c) => (
        <span className="font-bold text-xs text-slate-900 font-mono">
          ₹{c.wage.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (c) => {
        const isRunning = c.status === 'Running' || c.status === 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isRunning ? 'Running' : 'Expired'}
          </span>
        );
      },
    },
    {
      key: 'action',
      title: '',
      align: 'right',
      render: (c) => (
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contracts</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            List view of employee contracts
          </p>
        </div>

        {canManageContracts && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Contract
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ALL
          </button>

          {['Running', 'Expired'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(activeFilter === f ? 'ALL' : f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {f}
            </button>
          ))}

          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Contracts Data Table */}
      {isLoading ? (
        <LoadingSpinner text="Fetching contracts..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredContracts}
            onRowClick={(c) => navigate(`/contracts/${c.id}`)}
          />
        </div>
      )}

      {/* Useful Note Footer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="italic">
          Useful note: retain contract history, but make the active Running contract obvious because payroll depends on it.
        </p>
      </div>

      {/* Modal to Create Contract */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Contract"
        subtitle="Form view to assign new employee contract"
      >
        <form onSubmit={handleCreateContract} className="space-y-4">
          <Select
            label="Select Employee"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
            options={[
              { value: 1, label: 'Aarav Mehta (Payroll Specialist - Finance)' },
              { value: 2, label: 'Sara Khan (HR Officer - HR)' },
            ]}
          />

          <Input
            label="Contract Title"
            value={formData.contract_title}
            onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
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
              label="Monthly Wage (CTC)"
              type="number"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
