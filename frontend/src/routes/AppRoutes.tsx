import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { MainLayout } from '../components/layout/MainLayout';

// Pages
import { Login } from '../pages/auth/Login';
import { Dashboard } from '../pages/Dashboard';
import { EmployeeList } from '../pages/employees/EmployeeList';
import { EmployeeDetails } from '../pages/employees/EmployeeDetails';
import { ContractList } from '../pages/contracts/ContractList';
import { ContractDetails } from '../pages/contracts/ContractDetails';
import { AttendanceList } from '../pages/attendance/AttendanceList';
import { TimeOffPage } from '../pages/timeoff/TimeOffPage';
import { SalaryStructures } from '../pages/salary/SalaryStructures';
import { PayrunList } from '../pages/payroll/PayrunList';
import { PayrunDetails } from '../pages/payroll/PayrunDetails';
import { PayslipList } from '../pages/payroll/PayslipList';
import { UserList } from '../pages/users/UserList';
import { ReportsPage } from '../pages/reports/ReportsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated Root */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Employee Directory */}
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/:id" element={<EmployeeDetails />} />

          {/* Attendance */}
          <Route path="/attendance" element={<AttendanceList />} />

          {/* Time Off & Leaves */}
          <Route path="/time-off" element={<TimeOffPage />} />

          {/* Payslips */}
          <Route path="/payslips" element={<PayslipList />} />

          {/* Protected Contracts */}
          <Route
            element={<RoleRoute allowedRoles={['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN', 'HR_PAYROLL_USER', 'EMPLOYEE']} />}
          >
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
          </Route>

          {/* Protected Salary & Payroll */}
          <Route
            element={
              <RoleRoute allowedRoles={['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']} />
            }
          >
            <Route path="/salary" element={<SalaryStructures />} />
            <Route path="/payroll" element={<PayrunList />} />
            <Route path="/payroll/:id" element={<PayrunDetails />} />
          </Route>

          {/* Reports */}
          <Route
            element={
              <RoleRoute allowedRoles={['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']} />
            }
          >
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Admin User Management */}
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<UserList />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
