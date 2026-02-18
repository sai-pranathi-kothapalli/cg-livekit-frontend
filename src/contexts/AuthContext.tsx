/**
 * Authentication Context
 * 
 * Provides authentication state and functions throughout the application.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData, getUserRole, removeAuthToken, saveAuthToken, saveUserData } from '@/lib/api/client';

export interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  role: 'admin' | 'manager' | 'student';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStudent: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const userData = getUserData();
    const userRole = getUserRole();

    if (userData && userRole) {
      setUser(userData as User);
    }
    setIsLoading(false);

    // Listen for global logout events (e.g. from 401 interceptor)
    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = (userData: User, token: string) => {
    saveAuthToken(token);
    saveUserData(userData);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isStudent: user?.role === 'student',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

