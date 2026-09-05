import { api } from './api';

export interface TimeOffTypeItem {
  id: number;
  name: string;
  code: string;
  unit: string;
  requires_allocation: string;
  approval: string;
  payroll_work_entry: string;
  display_color: string;
  active: boolean;
  config_notes: string;
}

export interface AllocationItem {
  id: number;
  employee_id: number;
  employee_name: string;
  time_off_type_id: number;
  time_off_type_name: string;
  allocated_days: number;
  taken_days: number;
  remaining_days: number;
  status: 'Approved' | 'To Approve' | 'Refused';
  approver: string;
  validity: string;
  description: string;
}

export interface TimeOffRequestItem {
  id: number;
  employee_id: number;
  employee_name: string;
  time_off_type_id: number;
  time_off_type_name: string;
  start_date: string;
  end_date: string;
  duration: string;
  days_count: number;
  status: 'Approved' | 'To Approve' | 'Refused';
  approver: string;
  allocation_used: string;
  reason: string;
}

export const timeOffApi = {
  // Types
  getTypes: async (): Promise<TimeOffTypeItem[]> => {
    const res = await api.get('/time-off/types');
    return res.data;
  },
  createType: async (data: Partial<TimeOffTypeItem>): Promise<TimeOffTypeItem> => {
    const res = await api.post('/time-off/types', data);
    return res.data;
  },
  updateType: async (id: number, data: Partial<TimeOffTypeItem>): Promise<TimeOffTypeItem> => {
    const res = await api.put(`/time-off/types/${id}`, data);
    return res.data;
  },

  // Allocations
  getAllocations: async (): Promise<AllocationItem[]> => {
    const res = await api.get('/time-off/allocations');
    return res.data;
  },
  createAllocation: async (data: Partial<AllocationItem>): Promise<AllocationItem> => {
    const res = await api.post('/time-off/allocations', data);
    return res.data;
  },
  approveAllocation: async (id: number): Promise<AllocationItem> => {
    const res = await api.post(`/time-off/allocations/${id}/approve`);
    return res.data;
  },
  refuseAllocation: async (id: number): Promise<AllocationItem> => {
    const res = await api.post(`/time-off/allocations/${id}/refuse`);
    return res.data;
  },

  // Requests
  getRequests: async (): Promise<TimeOffRequestItem[]> => {
    const res = await api.get('/time-off/requests');
    return res.data;
  },
  createRequest: async (data: Partial<TimeOffRequestItem>): Promise<TimeOffRequestItem> => {
    const res = await api.post('/time-off/requests', data);
    return res.data;
  },
  approveRequest: async (id: number): Promise<TimeOffRequestItem> => {
    const res = await api.post(`/time-off/requests/${id}/approve`);
    return res.data;
  },
  refuseRequest: async (id: number): Promise<TimeOffRequestItem> => {
    const res = await api.post(`/time-off/requests/${id}/refuse`);
    return res.data;
  },
  simulatePayrollLop: async (data: {
    employee_name?: string;
    monthly_salary?: number;
    leave_type?: string;
    leave_days?: number;
    allocated_days?: number;
    used_days?: number;
  }): Promise<any> => {
    const res = await api.post('/time-off/simulate-payroll-lop', data);
    return res.data;
  },
};
