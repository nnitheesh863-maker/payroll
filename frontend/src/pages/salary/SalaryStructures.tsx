import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Shield, Layers, HelpCircle } from 'lucide-react';
import { salaryApi } from '../../services/salary.api';
import { SalaryStructure, SalaryRule } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePermission } from '../../hooks/usePermission';

export const SalaryStructures: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    code: '',
    name: '',
    category: 'ALLOWANCE' as const,
    rule_type: 'PERCENTAGE' as const,
    amount_or_percentage: 10,
    base_code: 'WAGE',
    sequence: 35,
    is_active: true,
  });

  const { canManageSalaryRules } = usePermission();

  const loadStructures = async () => {
    setIsLoading(true);
    try {
      const data = await salaryApi.listStructures();
      setStructures(data);
      if (data.length > 0) {
        setSelectedStructure(data[0]);
      }
    } catch (err) {
      console.error('Failed to load salary structures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructure) return;
    setIsSubmitting(true);
    try {
      await salaryApi.createRule({
        ...ruleForm,
        salary_structure_id: selectedStructure.id,
      });
      setIsRuleModalOpen(false);
      setRuleForm({
        code: '',
        name: '',
        category: 'ALLOWANCE',
        rule_type: 'PERCENTAGE',
        amount_or_percentage: 10,
        base_code: 'WAGE',
        sequence: 35,
        is_active: true,
      });
      await loadStructures();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to add rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId?: number) => {
    if (!ruleId || !confirm('Are you sure you want to remove this salary rule?')) return;
    try {
      await salaryApi.deleteRule(ruleId);
      await loadStructures();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ALLOWANCE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DEDUCTION':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'EMPLOYER_CONTRIBUTION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Salary Structures &amp; Computation Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic compensation rules, allowances, PF, TDS and deduction calculation pipelines
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching salary structures..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Structure Selector Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Active Structures ({structures.length})
            </h3>
            {structures.map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStructure(st)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedStructure?.id === st.id
                    ? 'bg-white border-primary-500 shadow-card ring-1 ring-primary-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-soft'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {st.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{st.description}</p>
                <p className="text-[11px] font-medium text-primary-600 mt-2">
                  {st.rules?.length || 0} calculation rules configured &rarr;
                </p>
              </div>
            ))}
          </div>

          {/* Rule Breakdown Pipeline */}
          <div className="lg:col-span-2">
            <Card
              title={selectedStructure?.name || 'Selected Structure Rules'}
              subtitle={`Code: ${selectedStructure?.code} &bull; Pipeline execution sequence`}
              action={
                canManageSalaryRules && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsRuleModalOpen(true)}
                  >
                    Add Rule
                  </Button>
                )
              }
            >
              <div className="space-y-3">
                {selectedStructure?.rules && selectedStructure.rules.length > 0 ? (
                  selectedStructure.rules.map((rule, idx) => (
                    <div
                      key={rule.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {rule.sequence}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                            <span className="font-mono text-[11px] text-slate-400">({rule.code})</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
                                rule.category
                              )}`}
                            >
                              {rule.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {rule.rule_type === 'PERCENTAGE'
                              ? `${rule.amount_or_percentage}% of ${rule.base_code || 'WAGE'}`
                              : `Fixed ₹ ${rule.amount_or_percentage.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      {canManageSalaryRules && (
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No rules configured.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Add Salary Rule"
        subtitle={`Adding rule to structure: ${selectedStructure?.name}`}
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Rule Code"
              placeholder="e.g. MEDICAL_ALLOW"
              value={ruleForm.code}
              onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="Rule Name"
              placeholder="e.g. Medical Allowance"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={ruleForm.category}
              onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as any })}
              options={[
                { value: 'BASIC', label: 'Basic Salary' },
                { value: 'ALLOWANCE', label: 'Allowance / Earning' },
                { value: 'DEDUCTION', label: 'Deduction (PF / TDS / PT)' },
                { value: 'EMPLOYER_CONTRIBUTION', label: 'Employer Contribution' },
              ]}
            />
            <Select
              label="Rule Type"
              value={ruleForm.rule_type}
              onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value as any })}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Amount (₹)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={ruleForm.rule_type === 'PERCENTAGE' ? 'Percentage Value' : 'Fixed Amount'}
              type="number"
              value={ruleForm.amount_or_percentage}
              onChange={(e) => setRuleForm({ ...ruleForm, amount_or_percentage: Number(e.target.value) })}
              required
            />
            <Select
              label="Calculated On"
              value={ruleForm.base_code}
              onChange={(e) => setRuleForm({ ...ruleForm, base_code: e.target.value })}
              options={[
                { value: 'WAGE', label: 'Base Wage' },
                { value: 'BASIC', label: 'Basic Salary' },
                { value: 'GROSS', label: 'Gross Salary' },
                { value: 'FIXED', label: 'Fixed Value' },
              ]}
            />
            <Input
              label="Sequence Order"
              type="number"
              value={ruleForm.sequence}
              onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
