import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'guardian';
  tenantId: string;
  status?: string;
  isPlatformAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPlatformAdmin: boolean;
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
  [key: string]: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
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
    try {
      // Check if trying to register as admin
      if (data.role === 'admin') {
        const adminExists = await isAdminExists(data.tenantId);
        if (adminExists) {
          throw new Error(
            'An admin already exists for this school. Please contact your school administrator.',
          );
        }
      }

      const response = await api.post('/auth/register', data);
      const { user, accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
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

  const isPlatformAdmin = user?.isPlatformAdmin === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPlatformAdmin,
        login,
        register,
        logout,
        isAdminExists,
      }}
    >
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