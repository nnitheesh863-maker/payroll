import { api } from './api';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
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
