import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDriver } from '../../context/DriverContext';

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

export default function DriverLoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useDriver();
  const navigate  = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await axios.post('/api/drivers/login', form);
      login(r.data.token, r.data.driver);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 14px', background: '#111',
    border: '1px solid #3a3a5a', borderRadius: 10, color: '#fff',
    boxSizing: 'border-box', fontSize: '0.95rem',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#1a1a2e', borderRadius: 16, padding: 40,
        maxWidth: 420, width: '100%', border: '1px solid #2a2a4a',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
          </div>
          <div style={{ background: '#0d2e1a', color: '#2ecc71', fontSize: '0.78rem', fontWeight: 700,
            padding: '4px 14px', borderRadius: 20, display: 'inline-block',
            textTransform: 'uppercase', letterSpacing: '1px' }}>
            Driver Portal
          </div>
        </div>

        <h2 style={{ color: '#fff', marginBottom: 6, textAlign: 'center' }}>Sign In</h2>
        <p style={{ color: '#666', fontSize: '0.88rem', textAlign: 'center', marginBottom: 24 }}>
          Access your deliveries, earnings and payments
        </p>

        {error && (
          <div style={{
            background: '#3a0d0d', border: '1px solid #e74c3c', borderRadius: 8,
            padding: '10px 14px', color: '#e74c3c', marginBottom: 16, fontSize: '0.88rem',
          }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Email Address</label>
            <input type="email" style={inp} required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="driver@ecorideuk.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...inp, paddingRight: 44 }}
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#888', display: 'flex', alignItems: 'center', padding: 0,
                }}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', background: loading ? '#1a5c35' : '#2ecc71',
            border: 'none', borderRadius: 10, color: '#000', fontWeight: 700,
            fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}