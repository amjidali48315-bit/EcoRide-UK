import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from './axiosConfig';
import { useCustomer } from '../context/CustomerContext';

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

export default function CustomerAuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', postcode: '' });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useCustomer();
  const navigate = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/customers/login' : '/api/customers/register';
      const payload  = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const r = await axios.post(endpoint, payload);
      login(r.data.token, r.data.customer);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.error || 'Something went wrong.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-wrap" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="form-card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e0e0e0' }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors([]); }}
              style={{
                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                background: mode === m ? '#2ecc71' : '#fff',
                color: mode === m ? '#fff' : '#555',
                fontWeight: 600, fontSize: '0.95rem',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h2 style={{ marginBottom: 6 }}>{mode === 'login' ? 'Welcome back!' : 'Join E-Scooter UK'}</h2>
        <p className="subtitle" style={{ marginBottom: 20 }}>
          {mode === 'login'
            ? 'Sign in to track orders and checkout faster.'
            : 'Create an account for a smoother checkout experience.'}
        </p>

        {errors.length > 0 && (
          <div className="error-list" style={{ marginBottom: 16 }}>
            {errors.map((e, i) => <p key={i}>• {e}</p>)}
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>Full Name</label>
              <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="John Smith" required />
            </div>
          )}

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" required />
          </div>

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
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

          {mode === 'register' && (
            <>
              <div className="form-row" style={{ marginBottom: 14 }}>
                <div className="form-field">
                  <label>Phone (optional)</label>
                  <input type="text" value={form.phone} onChange={set('phone')} placeholder="07700 000000" />
                </div>
                <div className="form-field">
                  <label>Postcode (optional)</label>
                  <input type="text" value={form.postcode} onChange={set('postcode')} placeholder="SW1A 1AA" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#888', fontSize: '0.9rem' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors([]); }}
            style={{ background: 'none', border: 'none', color: '#2ecc71', fontWeight: 600, cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}