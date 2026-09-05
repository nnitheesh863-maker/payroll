import { api } from './api';
import { User } from '../types';

export const userApi = {
  list: async (params?: { role?: string; status?: string }): Promise<User[]> => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  getById: async (id: number | string): Promise<User> => {
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
  update: async (id: number | string, data: Partial<User & { password?: string }>): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  updateStatus: async (id: number | string, is_active: boolean): Promise<User> => {
    const res = await api.patch(`/users/${id}/status`, { is_active });
    return res.data;
  },
  approve: async (id: number | string): Promise<{ message: string; user: User }> => {
    const res = await api.patch(`/users/${id}/approve`);
    return res.data;
  },
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

