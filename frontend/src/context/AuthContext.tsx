import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, role?: Role, password?: string) => Promise<void>;
  quickLoginAsRole: (role: Role) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
}

const roleCredentials: Record<Role, { email: string; pass: string; name: string }> = {
  ADMIN: { email: 'admin@peoplepay360.com', pass: 'Admin@123', name: 'Alexander Wright (Admin)' },
  HR_MANAGER: { email: 'hrmanager@peoplepay360.com', pass: 'HrManager@123', name: 'Sarah Jenkins (HR Mgr)' },
  HR_PAYROLL_MANAGER: { email: 'payrollmanager@peoplepay360.com', pass: 'PayrollManager@123', name: 'Marcus Chen (Payroll Mgr)' },
  HR_PAYROLL_USER: { email: 'payrolluser@peoplepay360.com', pass: 'PayrollUser@123', name: 'Elena Rostova (Payroll Spec)' },
  EMPLOYEE: { email: 'employee@peoplepay360.com', pass: 'Employee@123', name: 'David Kumar (Software Eng)' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('peoplepay_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('peoplepay_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('peoplepay_access_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('peoplepay_user', JSON.stringify(me));
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('peoplepay_access_token', res.access_token);
      localStorage.setItem('peoplepay_refresh_token', res.refresh_token);
      localStorage.setItem('peoplepay_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      // Clear any previous stale session
      localStorage.removeItem('peoplepay_access_token');
      localStorage.removeItem('peoplepay_refresh_token');
      localStorage.removeItem('peoplepay_user');
      setToken(null);
      setUser(null);
      // Re-throw so Login form can display exact invalid credentials error
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: Role = 'HR_MANAGER', password = 'Pass@123') => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ full_name: name, email, role, password });
      localStorage.setItem('peoplepay_access_token', res.access_token);
      localStorage.setItem('peoplepay_refresh_token', res.refresh_token);
      localStorage.setItem('peoplepay_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAsRole = async (role: Role) => {
    const cred = roleCredentials[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('peoplepay_access_token');
    localStorage.removeItem('peoplepay_refresh_token');
    localStorage.removeItem('peoplepay_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        quickLoginAsRole,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
