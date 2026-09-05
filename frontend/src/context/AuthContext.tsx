import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLoginAsRole: (role: Role) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
}

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
        } catch (err) {
          console.error('Session validation failed:', err);
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
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAsRole = async (role: Role) => {
    const roleCredentials: Record<Role, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@peoplepay360.com', pass: 'Admin@123' },
      HR_MANAGER: { email: 'hrmanager@peoplepay360.com', pass: 'HrManager@123' },
      HR_PAYROLL_MANAGER: { email: 'payrollmanager@peoplepay360.com', pass: 'PayrollManager@123' },
      HR_PAYROLL_USER: { email: 'payrolluser@peoplepay360.com', pass: 'PayrollUser@123' },
      EMPLOYEE: { email: 'employee@peoplepay360.com', pass: 'Employee@123' },
    };

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
    if (user.role === 'ADMIN') return true; // Admin has universal access
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
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
