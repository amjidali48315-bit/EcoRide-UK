import { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDriver } from '../../context/DriverContext';

const NAV = [
  { to: '/driver/dashboard', label: 'Dashboard', end: true },
  { to: '/driver/orders',    label: 'My Orders' },
  { to: '/driver/earnings',  label: 'Earnings' },
  { to: '/driver/payments',  label: 'Payments' },
  { to: '/driver/location',  label: 'My Location' },
];

const spinCss = '@keyframes _spin{to{transform:rotate(360deg)}}';
const spinDiv = { width: 32, height: 32, border: '3px solid #2a2a4a', borderTopColor: '#2ecc71', borderRadius: '50%', animation: '_spin 0.7s linear infinite' };

export default function DriverLayout() {
  const { driver, logout }  = useDriver();
  const navigate             = useNavigate();
  const [open, setOpen]      = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/driver');
  };

  const close = () => setOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button className="admin-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#fff', margin: '5px 0', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
        <span style={{ color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
          EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
          <span style={{ color: '#444', fontSize: '0.65rem', fontWeight: 400, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</span>
        </span>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#888', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem' }}>
          Sign Out
        </button>
      </div>

      {open && <div className="admin-overlay" onClick={close} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px', color: '#fff', lineHeight: 1 }}>
            EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#444', marginTop: 5, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Driver Portal
          </div>
          {driver?.name && (
            <div style={{ marginTop: 10, color: '#2ecc71', fontSize: '0.82rem', fontWeight: 600 }}>
              {driver.name}
            </div>
          )}
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              onClick={close}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="sidebar-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={spinDiv} /><style>{spinCss}</style>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}