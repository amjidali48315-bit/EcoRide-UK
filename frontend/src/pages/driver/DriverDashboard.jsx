import { useDriver } from '../../context/DriverContext';
import { useNavigate } from 'react-router-dom';

const fmtMoney = n => `£${Number(n || 0).toFixed(2)}`;
const fmtDate  = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_COLOR = {
  Pending: '#f39c12', Accepted: '#9b59b6', Assigned: '#3498db',
  Dispatched: '#1abc9c', Delivered: '#2ecc71', Cancelled: '#e74c3c',
};

export default function DriverDashboard() {
  const { driver, orders, activeOrders, deliveredOrders, pendingPayments, totalEarned, totalOwed } = useDriver();
  const navigate = useNavigate();

  const statCards = [
    { label: 'Active Orders',     value: activeOrders.length,    color: '#f39c12', link: '/driver/orders',   sub: 'Needs attention' },
    { label: 'Delivered',         value: deliveredOrders.length, color: '#2ecc71', link: '/driver/earnings', sub: 'Completed' },
    { label: 'Total Earned',      value: fmtMoney(totalEarned),  color: '#2ecc71', link: '/driver/earnings', sub: 'All time' },
    { label: 'Owed to Admin',     value: fmtMoney(totalOwed),    color: '#e74c3c', link: '/driver/payments', sub: `${pendingPayments.length} record${pendingPayments.length !== 1 ? 's' : ''}` },
  ];

  const recentOrders = [...orders].slice(0, 5);

  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar" style={{ marginBottom: 22 }}>
        <div>
          <span className="page-title">Dashboard</span>
        </div>
        <span style={{ color: '#555', fontSize: '0.82rem' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
        borderRadius: 14, padding: '18px 22px', marginBottom: 22,
        border: '1px solid #1a4a6a', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
          {(driver?.name || 'D')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Welcome back, {driver?.name}!</div>
          <div style={{ color: '#5dade2', fontSize: '0.8rem', marginTop: 2 }}>
            {driver?.city} · {driver?.payment_per_mile ? `£${driver.payment_per_mile}/mile` : ''}
            {driver?.postcode && <span style={{ color: '#555', marginLeft: 6 }}>{driver.postcode}</span>}
          </div>
        </div>
        {activeOrders.length > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: '#f39c12', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>{activeOrders.length}</div>
            <div style={{ color: '#888', fontSize: '0.72rem' }}>active {activeOrders.length === 1 ? 'order' : 'orders'}</div>
          </div>
        )}
      </div>

      {/* Pending payment alert */}
      {pendingPayments.length > 0 && (
        <div onClick={() => navigate('/driver/payments')} style={{
          background: '#2e0d0d', border: '1px solid #e74c3c55', borderRadius: 10,
          padding: '12px 18px', marginBottom: 18, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#e74c3c', fontSize: '0.88rem', fontWeight: 600 }}>
            {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending — {fmtMoney(totalOwed)} owed to admin
          </span>
          <span style={{ color: '#e74c3c', fontSize: '0.82rem', fontWeight: 600 }}>Pay Now →</span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 22 }}>
        {statCards.map(s => (
          <div key={s.label}
            onClick={() => navigate(s.link)}
            style={{
              background: '#1a1a2e', borderRadius: 12, padding: '16px 18px',
              border: `1px solid ${s.color}22`, borderLeft: `4px solid ${s.color}`,
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ color: s.color, fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#e8e8e8', fontSize: '0.82rem', fontWeight: 600, marginTop: 5 }}>{s.label}</div>
            <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Recent Orders</h3>
          <button onClick={() => navigate('/driver/orders')} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#2ecc71', cursor: 'pointer', fontSize: '0.78rem', padding: '5px 12px', borderRadius: 7, fontWeight: 600 }}>
            View All
          </button>
        </div>

        {recentOrders.length === 0 && (
          <p style={{ padding: '20px 18px', color: '#555', fontSize: '0.88rem', margin: 0 }}>No orders assigned yet.</p>
        )}

        {recentOrders.map(o => {
          const color = STATUS_COLOR[o.status] || '#888';
          return (
            <div key={o._id} style={{
              padding: '12px 18px', borderBottom: '1px solid #111',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              borderLeft: `3px solid ${color}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.order_ref}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: color + '20', color, border: `1px solid ${color}33` }}>{o.status}</span>
                </div>
                <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.88rem' }}>{o.customer_name}</div>
                <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.address}, {o.postcode}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.9rem' }}>{fmtMoney(o.total_amount)}</div>
                <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 2 }}>{fmtDate(o.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}