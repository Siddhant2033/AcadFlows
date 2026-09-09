import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'guardian';
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAdminExists: (tenantId: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'guardian';
  tenantId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    console.log('🔍 Register called with data:', data);
    
    // Validate that tenantId exists
    if (!data.tenantId) {
      console.error('❌ tenantId is missing from registration data');
      throw new Error('School ID is required. Please verify your school code.');
    }

    // Check if trying to register as admin
    if (data.role === 'admin') {
      // Check if admin already exists for this tenant
      const adminExists = await isAdminExists(data.tenantId);
      if (adminExists) {
        throw new Error('An admin already exists for this school. Please contact your school administrator.');
      }
    }

    try {
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        tenantId: data.tenantId,
      });
      
      console.log('✅ Registration successful:', response.data);
      
      const { user, accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
    } catch (error: any) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const isAdminExists = async (tenantId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/users/admin-exists/${tenantId}`);
      return response.data.data.exists;
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAdminExists }}>
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