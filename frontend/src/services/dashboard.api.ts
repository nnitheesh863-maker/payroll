import { api } from './api';
import { DashboardMetrics } from '../types';

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await api.get('/dashboard');
    return res.data;
  },
};
