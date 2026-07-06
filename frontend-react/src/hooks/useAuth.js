import { useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, fetchMe } from '../api';

export function useAuth() {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetchMe()
      .then(data => { if (data) setUser(data); })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const { data, ok } = await apiLogin(username, password);
    if (!ok) return data.error;
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser({ username: data.username });
    return null;
  }

  async function register(username, email, password) {
    const { data, ok } = await apiRegister(username, email, password);
    if (!ok) return data.error;
    return login(username, password);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  }

  return { user, loading, login, register, logout };
}