'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const { data, error } = await authApi.me();
    if (data && !error) {
      setUser(data);
    } else {
      localStorage.removeItem('admin_token');
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);

    if (error) {
      return { success: false, error };
    }

    if (data) {
      localStorage.setItem('admin_token', data.token);
      setUser(data.user);
      return { success: true };
    }

    return { success: false, error: 'Unknown error' };
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
