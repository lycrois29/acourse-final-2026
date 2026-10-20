import { createContext, useCallback, useEffect, useState } from 'react';
export const UserContext = createContext(null);
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export function UserProvider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  const api = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem('course-token');
    const response = await fetch(API + '/api' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
    const data = await response.json().catch(() => ({ message: 'Unexpected server response' }));
    if (!response.ok) {
      if (response.status === 401) { sessionStorage.removeItem('course-token'); setUser(null); }
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }, []);
  useEffect(() => {
    let active = true;
    if (!sessionStorage.getItem('course-token')) { setReady(true); return; }
    api('/user').then(data => { if (active) setUser(data.user); })
      .catch(() => { sessionStorage.removeItem('course-token'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [api]);
  async function login(login, password) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) });
    sessionStorage.setItem('course-token', data.token); setUser(data.user);
  }
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('course-token'); setUser(null);
  }
  return <UserContext.Provider value={{ user, ready, api, login, logout }}>{children}</UserContext.Provider>;
}
