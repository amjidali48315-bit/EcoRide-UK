import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../axiosConfig';

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const saved  = localStorage.getItem('customer_info');
    if (token && saved) {
      try {
        setCustomer(JSON.parse(saved));
        fetchCart(token);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const fetchCart = async (token) => {
    try {
      const r = await axios.get('/api/customers/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(r.data?.items || []);
    } catch { /* ignore */ }
  };

  const login = (token, info) => {
    localStorage.setItem('customer_token', token);
    localStorage.setItem('customer_info', JSON.stringify(info));
    setCustomer(info);
    fetchCart(token);
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_info');
    setCustomer(null);
    setCart([]);
  };

  const getToken = () => localStorage.getItem('customer_token');

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!customer) {
      setCart(prev => {
        const idx = prev.findIndex(i => i.product_id === product._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity };
          return updated;
        }
        return [...prev, {
          product_id: product._id,
          product_name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        }];
      });
      return;
    }
    try {
      const r = await axios.post('/api/customers/cart', {
        product_id: product._id,
        product_name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      }, authHeaders());
      setCart(r.data?.items || []);
    } catch (err) {
      console.error('Cart error:', err);
    }
  }, [customer]);

  const removeFromCart = useCallback(async (productId) => {
    if (!customer) {
      setCart(prev => prev.filter(i => i.product_id !== productId));
      return;
    }
    try {
      const r = await axios.delete(`/api/customers/cart/${productId}`, authHeaders());
      setCart(r.data?.items || []);
    } catch (err) {
      console.error('Cart remove error:', err);
    }
  }, [customer]);

  const clearCart = useCallback(async () => {
    if (!customer) { setCart([]); return; }
    try {
      await axios.delete('/api/customers/cart', authHeaders());
      setCart([]);
    } catch (err) {
      console.error('Cart clear error:', err);
    }
  }, [customer]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CustomerContext.Provider value={{
      customer, cart, cartTotal, cartCount, loading,
      login, logout, getToken, authHeaders,
      addToCart, removeFromCart, clearCart,
      setCart,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  return useContext(CustomerContext);
}
