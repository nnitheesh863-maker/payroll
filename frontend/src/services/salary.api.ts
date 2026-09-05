import { api } from './api';
import { SalaryStructure, SalaryRule } from '../types';

export const salaryApi = {
  listStructures: async (): Promise<SalaryStructure[]> => {
    const res = await api.get('/salary/structures');
    return res.data;
  },
  getStructure: async (id: number): Promise<SalaryStructure> => {
    const res = await api.get(`/salary/structures/${id}`);
    return res.data;
  },
  createStructure: async (data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const res = await api.post('/salary/structures', data);
    return res.data;
  },
  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    const res = await api.post('/salary/rules', data);
    return res.data;
  },
  deleteRule: async (id: number): Promise<void> => {
    await api.delete(`/salary/rules/${id}`);
  },
};
