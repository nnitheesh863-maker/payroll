import { api } from './api';
import { Payrun, Payslip } from '../types';

export const payrollApi = {
  listPayruns: async (params?: { status?: string }): Promise<Payrun[]> => {
    const res = await api.get('/payruns', { params });
    return res.data;
  },
  getPayrun: async (id: number): Promise<Payrun> => {
    const res = await api.get(`/payruns/${id}`);
    return res.data;
  },
  createPayrun: async (data: {
    name: string;
    period_start: string;
    period_end: string;
    pay_date: string;
    pay_structure?: string;
    selected_employee_ids?: number[];
    notes?: string;
  }): Promise<Payrun> => {
    const res = await api.post('/payruns', data);
    return res.data;
  },
  getPayrunPayslips: async (id: number): Promise<Payslip[]> => {
    const res = await api.get(`/payruns/${id}/payslips`);
    return res.data;
  },
  computePayrun: async (id: number): Promise<Payrun> => {
    const res = await api.post(`/payruns/${id}/compute`);
    return res.data;
  },
  validatePayrun: async (id: number): Promise<Payrun> => {
    const res = await api.post(`/payruns/${id}/validate`);
    return res.data;
  },
  markPaid: async (id: number): Promise<Payrun> => {
    const res = await api.post(`/payruns/${id}/mark-paid`);
    return res.data;
  },
  sendPayslips: async (id: number): Promise<Payrun> => {
    const res = await api.post(`/payruns/${id}/send-payslips`);
    return res.data;
  },
};
