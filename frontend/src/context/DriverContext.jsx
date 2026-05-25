import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../axiosConfig';

const DriverContext = createContext(null);

export function DriverProvider({ children }) {
  const [driver, setDriver]   = useState(null);
  const [orders, setOrders]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('driver_token');
  const authH    = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const fetchOrders = useCallback(async () => {
    try {
      const r = await axios.get('/api/drivers/my-orders', authH());
      setOrders(r.data);
    } catch { /* ignore */ }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const r = await axios.get('/api/drivers/my-payments', authH());
      setPayments(r.data);
    } catch { /* ignore */ }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const r = await axios.get('/api/drivers/me', authH());
      const updated = { ...r.data, id: r.data._id };
      setDriver(updated);
      localStorage.setItem('driver_info', JSON.stringify(updated));
    } catch { /* ignore */ }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchPayments(), fetchMe()]);
  }, [fetchOrders, fetchPayments, fetchMe]);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    const info  = localStorage.getItem('driver_info');
    if (token && info) {
      try { setDriver(JSON.parse(info)); } catch { /* ignore */ }
      Promise.all([fetchOrders(), fetchPayments()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, driverInfo) => {
    localStorage.setItem('driver_token', token);
    localStorage.setItem('driver_info', JSON.stringify(driverInfo));
    setDriver(driverInfo);
    fetchOrders();
    fetchPayments();
  };

  const logout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_info');
    setDriver(null);
    setOrders([]);
    setPayments([]);
  };

  const updatePostcode = async (postcode) => {
    const r = await axios.put('/api/drivers/postcode', { postcode }, authH());
    const updated = { ...driver, postcode: r.data.postcode };
    setDriver(updated);
    localStorage.setItem('driver_info', JSON.stringify(updated));
    await fetchOrders(); 
  };

  const updateOrderStatus = async (orderId, status, cancellation_reason = '') => {
    await axios.put(`/api/drivers/orders/${orderId}/status`, { status, cancellation_reason }, authH());
    await refresh();
  };

  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const activeOrders    = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const pendingPayments = payments.filter(p => ['Pending', 'Partial'].includes(p.payment_status));
  const totalEarned     = payments.reduce((s, p) => s + (p.driver_earning || 0), 0);
  const totalOwed       = pendingPayments.reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
  const totalPaid       = payments.filter(p => p.payment_status === 'Paid').reduce((s, p) => s + (p.amount_owed || 0), 0);

  return (
    <DriverContext.Provider value={{
      driver, orders, payments, loading,
      activeOrders, deliveredOrders, pendingPayments,
      totalEarned, totalOwed, totalPaid,
      login, logout, refresh,
      updatePostcode, updateOrderStatus,
      getToken, authH,
      fetchOrders, fetchPayments,
    }}>
      {children}
    </DriverContext.Provider>
  );
}

export const useDriver = () => useContext(DriverContext);