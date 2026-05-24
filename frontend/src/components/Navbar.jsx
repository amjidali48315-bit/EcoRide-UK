import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useCustomer } from '../context/CustomerContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin } = useAdmin();
  const { customer, cartCount, logout } = useCustomer();

  const close = () => setOpen(false);
  const isActive = (path) => pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 38, height: 38, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          border: '2px solid #2ecc71',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0d1f0d',
        }}>
          <img
            src="/images/logo.png"
            alt="EcoRide UK"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              // fallback: hide img, show initials
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML =
                '<span style="color:#2ecc71;font-weight:800;font-size:0.85rem;font-family:Rajdhani,sans-serif;letter-spacing:-0.5px">ER</span>';
            }}
          />
        </span>
        EcoRide <span>UK</span>
      </Link>

      <button className={`hamburger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <ul className={`nav-links ${open ? 'open' : ''}`}>
        <li><Link to="/" className={isActive('/')} onClick={close}>Home</Link></li>
        <li><Link to="/contact" className={isActive('/contact')} onClick={close}>Contact</Link></li>
        <li><Link to="/my-orders" className={isActive('/my-orders')} onClick={close}>My Orders</Link></li>

        {/* Cart */}
        <li>
          <Link to="/cart" className={isActive('/cart')} onClick={close}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Cart
            {cartCount > 0 && (
              <span style={{
                background: '#2ecc71', color: '#000', borderRadius: '50%',
                width: 18, height: 18, fontSize: '0.7rem', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </li>

        {/* Customer auth */}
        {customer ? (
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600 }}>
              Hi, {customer.full_name?.split(' ')[0]}
            </span>
            <button onClick={handleLogout} style={{
              background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#aaa',
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
            }}>Sign Out</button>
          </li>
        ) : (
          <li><Link to="/login" className={`nav-login ${isActive('/login')}`} onClick={close}>Sign In</Link></li>
        )}

        {admin && (
          <li>
            <Link to="/admin" className={`admin-link ${pathname.startsWith('/admin') ? 'active' : ''}`} onClick={close}>
              Admin Panel
            </Link>
          </li>
        )}

        <li><Link to="/products" className="nav-cta" onClick={close}>Shop Now</Link></li>
      </ul>
    </nav>
  );
}