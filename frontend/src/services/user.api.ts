import { api } from './api';
import { User } from '../types';

export const userApi = {
  list: async (params?: { role?: string }): Promise<User[]> => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  getById: async (id: number): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  create: async (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    employee_id?: number | null;
    is_active?: boolean;
  }): Promise<User> => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id: number, data: Partial<User & { password?: string }>): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  updateStatus: async (id: number, is_active: boolean): Promise<User> => {
    const res = await api.patch(`/users/${id}/status`, { is_active });
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
