import { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';

const NAV = [
  { to: '/admin',           label: 'Dashboard', end: true },
  { to: '/admin/orders',    label: 'Orders' },
  { to: '/admin/drivers',   label: 'Drivers', badge: true },
  { to: '/admin/products',  label: 'Products' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/stock',     label: 'Stock' },
  { to: '/admin/videos',    label: 'Videos' },
  { to: '/admin/payments',  label: 'Payments' },
  { to: '/admin/reviews',   label: 'Reviews' },
  { to: '/admin/contacts',  label: 'Messages' },
  { to: '/admin/chat',      label: 'Live Chat' },
  { to: '/admin/cities',    label: 'City Management' },
  { to: '/admin/settings',  label: 'Settings' },
];

export default function AdminLayout() {
  const { setAdmin }            = useAdmin();
  const navigate                = useNavigate();
  const [open, setOpen]         = useState(false);
  const [locBadge, setLocBadge] = useState(0);

  useEffect(() => {
    const load = () =>
      axios.get('/api/drivers/admin/location-requests?status=Pending', { withCredentials: true })
        .then(r => setLocBadge(r.data.length)).catch(() => {});
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const logout = async () => {
    await axios.post('/api/admin/logout', {}, { withCredentials: true });
    setAdmin(null);
    navigate('/admin/login');
  };

  const close = () => setOpen(false);

  return (
    <div className="admin-layout">
      <div className="admin-mobile-bar">
        <button className="admin-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
        <span style={{ color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
          EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
          <span style={{ color: '#444', fontSize: '0.65rem', fontWeight: 400, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Admin</span>
        </span>
        <button onClick={logout} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#888', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem' }}>
          Sign Out
        </button>
      </div>

      {open && <div className="admin-overlay" onClick={close} />}

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px', color: '#fff', lineHeight: 1 }}>
            EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#444', marginTop: 5, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Admin Panel
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map(({ to, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              onClick={close}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{label}</span>
              {badge && locBadge > 0 && (
                <span style={{ background: '#f39c12', color: '#000', borderRadius: 20, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 800, minWidth: 18, textAlign: 'center' }}>
                  {locBadge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="sidebar-logout" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #2a2a4a', borderTopColor: '#2ecc71', borderRadius: '50%', animation: '_spin 0.7s linear infinite' }} />
            <style>{'@keyframes _spin{to{transform:rotate(360deg)}}'}</style>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}