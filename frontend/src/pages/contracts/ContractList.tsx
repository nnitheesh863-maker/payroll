import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, DollarSign } from 'lucide-react';
import { contractApi } from '../../services/contract.api';
import { employeeApi } from '../../services/employee.api';
import { salaryApi } from '../../services/salary.api';
import { Contract, Employee, SalaryStructure } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const ContractList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: 1,
    contract_title: 'Full-Time Employment Agreement',
    contract_type: 'FULL_TIME',
    start_date: new Date().toISOString().split('T')[0],
    wage: 85000,
    working_hours_per_week: 40,
    salary_structure_id: 1,
    status: 'ACTIVE' as const,
  });

  const { canManageContracts } = usePermission();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, eList, sList] = await Promise.all([
        contractApi.list(),
        employeeApi.list(),
        salaryApi.listStructures(),
      ]);
      setContracts(cList);
      setEmployees(eList);
      setStructures(sList);
      if (eList.length > 0) {
        setFormData((prev) => ({ ...prev, employee_id: eList[0].id }));
      }
      if (sList.length > 0) {
        setFormData((prev) => ({ ...prev, salary_structure_id: sList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contractApi.create(formData as any);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Contract>[] = [
    {
      key: 'employee',
      title: 'Employee',
      render: (c) => {
        const emp = employees.find((e) => e.id === c.employee_id);
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-xs">
              {emp ? `${emp.first_name} ${emp.last_name}` : `EMP #${c.employee_id}`}
            </span>
            {emp && <span className="font-mono text-[11px] text-slate-400">({emp.emp_code})</span>}
          </div>
        );
      },
    },
    { key: 'contract_title', title: 'Contract Title', render: (c) => <span className="text-xs text-slate-700 font-medium">{c.contract_title}</span> },
    { key: 'contract_type', title: 'Type', render: (c) => <span className="text-xs">{c.contract_type}</span> },
    { key: 'start_date', title: 'Start Date', render: (c) => <span className="text-xs text-slate-500">{c.start_date}</span> },
    {
      key: 'wage',
      title: 'Monthly Wage (CTC)',
      align: 'right',
      render: (c) => <span className="font-bold font-mono text-xs text-slate-900">₹ {c.wage.toLocaleString()}</span>,
    },
    { key: 'status', title: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employment Contracts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee wage contracts, terms, and salary structure assignments
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

      {isLoading ? (
        <LoadingSpinner text="Fetching contracts..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
          <DataTable columns={columns} data={contracts} />
        </div>
      )}

      {/* Create Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Employment Contract"
        subtitle="Bind an employee to a base wage and salary structure."
      >
        <form onSubmit={handleCreateContract} className="space-y-4">
          <Select
            label="Select Employee"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.emp_code} - ${emp.first_name} ${emp.last_name} (${emp.department})`,
            }))}
            required
          />

          <Input
            label="Contract Title"
            value={formData.contract_title}
            onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Contract Type"
              value={formData.contract_type}
              onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
              options={[
                { value: 'FULL_TIME', label: 'Full Time' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'CONTRACT', label: 'Contractor' },
                { value: 'INTERN', label: 'Intern' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly Base Wage (INR)"
              type="number"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
              required
            />
            <Select
              label="Salary Structure"
              value={formData.salary_structure_id}
              onChange={(e) => setFormData({ ...formData, salary_structure_id: Number(e.target.value) })}
              options={structures.map((s) => ({ value: s.id, label: s.name }))}
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
