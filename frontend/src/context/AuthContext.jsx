import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('assetflow_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('assetflow_token', data.token);
    localStorage.setItem('assetflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function signup(name, email, password) {
    await client.post('/auth/signup', { name, email, password });
  }

  function logout() {
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
