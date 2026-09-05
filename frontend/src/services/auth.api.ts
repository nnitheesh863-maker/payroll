import { api } from './api';
import { User, Role } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data: { name?: string; full_name?: string; email: string; password?: string; role?: Role }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  refreshToken: async (refresh_token: string) => {
    const response = await api.post('/auth/refresh', { refresh_token });
    return response.data;
  },
};
