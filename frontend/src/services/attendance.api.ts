import { api } from './api';
import { Attendance } from '../types';

export const attendanceApi = {
  list: async (params?: { start_date?: string; end_date?: string; employee_id?: number; status?: string }): Promise<Attendance[]> => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },
  getToday: async (): Promise<Attendance | null> => {
    const res = await api.get('/attendance/today');
    return res.data;
  },
  checkIn: async (data?: { employee_id?: number }): Promise<Attendance> => {
    const res = await api.post('/attendance/check-in', data || {});
    return res.data;
  },
  checkOut: async (data?: { employee_id?: number; notes?: string }): Promise<Attendance> => {
    const res = await api.post('/attendance/check-out', data || {});
    return res.data;
  },
  update: async (id: number, data: Partial<Attendance>): Promise<Attendance> => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },
};
