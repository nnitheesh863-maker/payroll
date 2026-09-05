import { api } from './api';
import { Payslip } from '../types';

export const payslipApi = {
  list: async (params?: { employee_id?: number; payrun_id?: number }): Promise<Payslip[]> => {
    const res = await api.get('/payslips', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Payslip> => {
    const res = await api.get(`/payslips/${id}`);
    return res.data;
  },
  getPdfUrl: (id: number): string => {
    const token = localStorage.getItem('peoplepay_access_token');
    return `/api/payslips/${id}/pdf?token=${token}`;
  },
  downloadPdf: async (id: number, payslipNumber: string) => {
    const response = await api.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Payslip_${payslipNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  sendEmail: async (id: number): Promise<{ message: string }> => {
    const res = await api.post(`/payslips/${id}/send-email`);
    return res.data;
  },
};
