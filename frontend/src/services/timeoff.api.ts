import { api } from './api';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../types';

export const timeOffApi = {
  getTypes: async (): Promise<TimeOffType[]> => {
    const res = await api.get('/time-off/types');
    return res.data;
  },
  getAllocations: async (employee_id?: number): Promise<TimeOffAllocation[]> => {
    const res = await api.get('/time-off/allocations', { params: { employee_id } });
    return res.data;
  },
  getRequests: async (params?: { status_filter?: string; employee_id?: number }): Promise<TimeOffRequest[]> => {
    const res = await api.get('/time-off/requests', { params });
    return res.data;
  },
  submitRequest: async (data: {
    employee_id?: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    days_count: number;
    reason: string;
  }): Promise<TimeOffRequest> => {
    const res = await api.post('/time-off/requests', data);
    return res.data;
  },
  approveRequest: async (id: number): Promise<TimeOffRequest> => {
    const res = await api.put(`/time-off/requests/${id}/approve`);
    return res.data;
  },
  rejectRequest: async (id: number, rejection_reason?: string): Promise<TimeOffRequest> => {
    const res = await api.put(`/time-off/requests/${id}/reject`, { status: 'REJECTED', rejection_reason });
    return res.data;
  },
};
