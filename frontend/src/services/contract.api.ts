import { api } from './api';
import { Contract } from '../types';

export const contractApi = {
  list: async (params?: { employee_id?: number; status?: string }): Promise<Contract[]> => {
    const res = await api.get('/contracts', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Contract> => {
    const res = await api.get(`/contracts/${id}`);
    return res.data;
  },
  create: async (data: Partial<Contract>): Promise<Contract> => {
    const res = await api.post('/contracts', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Contract>): Promise<Contract> => {
    const res = await api.put(`/contracts/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};
