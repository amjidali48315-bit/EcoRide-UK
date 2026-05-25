import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

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

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function AdminLogin() {
  const { login } = useAdmin();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (false) {
      setError('Password must be at least 8 characters and include letters, numbers, and symbols (e.g. !@#$%).');
      return;
    }

    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>E-Scooter <span>UK</span></h1>
          <p>Admin Panel</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={submit} autoComplete="off">
          <div className="login-form-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Enter your password"
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in…' : 'Login to Dashboard'}
          </button>
        </form>

        <Link to="/" className="back-link">← Back to Website</Link>
      </div>
    </div>
  );
}