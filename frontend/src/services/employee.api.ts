import { api } from './api';
import { Employee, Contract, Attendance, TimeOffRequest, TimeOffAllocation, Payslip } from '../types';

export const employeeApi = {
  list: async (params?: { department?: string; status?: string; search?: string }): Promise<Employee[]> => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Employee> => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  create: async (data: Partial<Employee>): Promise<Employee> => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Employee>): Promise<Employee> => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
  getContracts: async (id: number): Promise<Contract[]> => {
    const res = await api.get(`/employees/${id}/contracts`);
    return res.data;
  },
  getAttendance: async (id: number): Promise<Attendance[]> => {
    const res = await api.get(`/employees/${id}/attendance`);
    return res.data;
  },
  getTimeOff: async (id: number): Promise<TimeOffRequest[]> => {
    const res = await api.get(`/employees/${id}/time-off`);
    return res.data;
  },
  getAllocations: async (id: number): Promise<TimeOffAllocation[]> => {
    const res = await api.get(`/employees/${id}/allocations`);
    return res.data;
  },
  getPayslips: async (id: number): Promise<Payslip[]> => {
    const res = await api.get(`/employees/${id}/payslips`);
    return res.data;
  },
};
