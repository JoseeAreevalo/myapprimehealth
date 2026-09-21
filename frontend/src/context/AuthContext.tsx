import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../api/config';

interface User {
  id: number;
  email: string;
  fullName?: string | null;
  name?: string | null;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'prime_health_token';

function normaliseUser(rawUser?: Partial<User> | null): User | null {
  if (!rawUser) {
    return null;
  }

  const role = rawUser.role ?? 'client';
  const fullName = rawUser.fullName ?? rawUser.name ?? null;

  return {
    id: Number(rawUser.id ?? 0),
    email: rawUser.email ?? '',
    fullName,
    name: fullName,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${api.baseURL}${api.endpoints.authMe}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const nextUser = normaliseUser(res.data?.user ?? res.data ?? null);
        if (nextUser) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setTokenState(null);
      });
  }, [token]);

  const persistSession = (payload: { accessToken?: string; token?: string; user?: Partial<User> | null }) => {
    const token = payload?.accessToken ?? payload?.token;
    const nextUser = normaliseUser(payload?.user ?? null);

    if (!token) {
      throw new Error('La respuesta de autenticación no incluyó un token.');
    }

    localStorage.setItem(TOKEN_KEY, token);
    setTokenState(token);
    if (nextUser) {
      setUser(nextUser);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${api.baseURL}${api.endpoints.authLogin}`, { email, password });
    persistSession(res.data);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await axios.post(`${api.baseURL}${api.endpoints.authRegister}`, {
      email,
      password,
      fullName: name,
    });
    persistSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'coach',
        user,
        token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
