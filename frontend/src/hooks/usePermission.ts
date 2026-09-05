import { useAuth } from './useAuth';
import { Role } from '../types';

export const usePermission = () => {
  const { user, hasRole } = useAuth();

  const isEmployee = user?.role === 'EMPLOYEE';
  const isHRManager = user?.role === 'HR_MANAGER';
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const isPayrollManager = user?.role === 'HR_PAYROLL_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const canManageEmployees = hasRole(['HR_MANAGER', 'ADMIN']);
  const canManageContracts = hasRole(['HR_MANAGER', 'ADMIN', 'HR_PAYROLL_MANAGER']);
  const canManageSalaryRules = hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  const canCreatePayrun = hasRole(['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  const canValidatePayrun = hasRole(['HR_PAYROLL_MANAGER', 'ADMIN']);
  const canApproveLeaves = hasRole(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  const canManageUsers = isAdmin;

  return {
    user,
    isEmployee,
    isHRManager,
    isPayrollUser,
    isPayrollManager,
    isAdmin,
    canManageEmployees,
    canManageContracts,
    canManageSalaryRules,
    canCreatePayrun,
    canValidatePayrun,
    canApproveLeaves,
    canManageUsers,
    hasRole,
  };
};
