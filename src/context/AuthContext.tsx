import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Role } from '../shared/types';
import { getStore } from '../store/data';

interface AuthState {
  user: User | null;
  login: (email: string, password: string, role: Role) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const AUTH_KEY = 'hmcs-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  const login = useCallback((email: string, password: string, role: Role) => {
    const store = getStore();
    const found = store.users.find(u => u.email === email && u.password === password);

    if (!found) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (found.role !== role) {
      return { success: false, error: 'Invalid credentials for this login path.' };
    }

    setUser(found);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
