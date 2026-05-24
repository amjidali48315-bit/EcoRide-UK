import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const fmtMoney = n => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard', { withCredentials: true })
      .then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#555' }}>Loading dashboard…</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Orders',   value: data.totalOrders,     color: '#3498db', link: '/admin/orders' },
    { label: 'Pending',        value: data.pendingOrders,   color: '#f39c12', link: '/admin/orders' },
    { label: 'Delivered',      value: data.deliveredOrders, color: '#2ecc71', link: '/admin/orders' },
    { label: 'Products',       value: data.totalProducts,   color: '#9b59b6', link: '/admin/products' },
    { label: 'Customers',      value: data.totalCustomers,  color: '#1abc9c', link: '/admin/customers' },
    { label: 'Drivers',        value: data.totalDrivers,    color: '#e67e22', link: '/admin/drivers' },
  ];

  const financeCards = [
    { label: 'Revenue',        value: data.totalRevenue,  color: '#2ecc71' },
    { label: 'Stock Value',    value: data.totalCost,     color: '#e74c3c' },
    { label: 'Driver Pay',     value: data.totalDriverPay,color: '#e67e22' },
    { label: 'Net Profit',     value: data.totalProfit,   color: data.totalProfit >= 0 ? '#27ae60' : '#e74c3c', highlight: true },
  ];

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 24 }}>
        <div>
          <span className="page-title">Dashboard</span>
          <div style={{ color: '#444', fontSize: '0.78rem', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stat cards — 2 columns on mobile, 3 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map(card => (
          <Link key={card.label} to={card.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1a1a2e', border: `1px solid ${card.color}22`, borderLeft: `4px solid ${card.color}`, borderRadius: 14, padding: '18px 16px', cursor: 'pointer' }}>
              <div style={{ color: card.color, fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: 6, fontFamily: 'Rajdhani, sans-serif' }}>
                {card.value}
              </div>
              <div style={{ color: '#e8e8e8', fontWeight: 600, fontSize: '0.85rem' }}>{card.label}</div>
              <div style={{ color: card.color + 'aa', fontSize: '0.7rem', marginTop: 4 }}>View →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Financial summary */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h3 style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, margin: 0 }}>Financial Summary</h3>
          <div style={{ flex: 1, height: 1, background: '#2a2a4a' }} />
          <span style={{ color: '#444', fontSize: '0.72rem' }}>Delivered only</span>
        </div>

        {/* 2 columns on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {financeCards.map(card => (
            <div key={card.label} style={{ background: card.highlight ? `${card.color}0d` : '#1a1a2e', border: `1px solid ${card.color}${card.highlight ? '44' : '1a'}`, borderRadius: 14, padding: '16px 14px', boxShadow: card.highlight ? `0 0 20px ${card.color}12` : 'none' }}>
              <div style={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{card.label}</div>
              <div style={{ color: card.color, fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '-0.5px' }}>{fmtMoney(card.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}