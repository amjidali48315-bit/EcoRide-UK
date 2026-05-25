import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axiosConfig';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);   
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/me', { withCredentials: true })
      .then(r => { if (r.data.loggedIn) setAdmin({ username: r.data.username }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await axios.post('/api/admin/login', { username, password }, { withCredentials: true });
    setAdmin({ username: r.data.username });
    return r.data;
  };

  const logout = async () => {
    await axios.post('/api/admin/logout', {}, { withCredentials: true });
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
