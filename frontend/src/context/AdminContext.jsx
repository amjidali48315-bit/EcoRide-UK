import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axiosConfig';

const AdminContext = createContext(null);

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('admin_token');
const setToken = (t) => t ? localStorage.setItem('admin_token', t) : localStorage.removeItem('admin_token');

// Set axios default header
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export function AdminProvider({ children }) {
  const [admin,   setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setAuthHeader(token);
      axios.get('/api/admin/me', { withCredentials: true })
        .then(r => { if (r.data.loggedIn) setAdmin({ username: r.data.username }); })
        .catch(() => { setToken(null); setAuthHeader(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const r = await axios.post('/api/admin/login', { username, password }, { withCredentials: true });
    if (r.data.token) {
      setToken(r.data.token);
      setAuthHeader(r.data.token);
    }
    setAdmin({ username: r.data.username });
    return r.data;
  };

  const logout = async () => {
    await axios.post('/api/admin/logout', {}, { withCredentials: true });
    setToken(null);
    setAuthHeader(null);
    setAdmin(null);
  };

  const updateAdmin = (newData) => {
    if (newData.token) {
      setToken(newData.token);
      setAuthHeader(newData.token);
    }
    setAdmin(prev => ({ ...prev, ...newData }));
  };

  return (
    <AdminContext.Provider value={{ admin, loading, login, logout, setAdmin, updateAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
