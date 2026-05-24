import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminManagement() {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ username: '', password: '' });
  const [saving, setSaving]       = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setErr(''); }
    else     { setErr(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  const load = () => {
    setLoading(true);
    axios.get('/api/admin/admins', { withCredentials: true })
      .then(r => setAdmins(r.data))
      .catch(() => flash(false, 'Failed to load admins.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const addAdmin = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { flash(false, 'Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/admin/admins', form, { withCredentials: true });
      flash(true, `Admin "${form.username}" added successfully.`);
      setForm({ username: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      flash(false, err.response?.data?.error || 'Failed to add admin.');
    } finally { setSaving(false); }
  };

  const removeAdmin = async (id, username) => {
    if (!window.confirm(`Remove admin "${username}"? They will no longer be able to log in.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/admins/${id}`, { withCredentials: true });
      flash(true, `Admin "${username}" removed.`);
      load();
    } catch (err) {
      flash(false, err.response?.data?.error || 'Failed to remove admin.');
    } finally { setDeletingId(null); }
  };

  const inp = {
    width: '100%', padding: '9px 12px', background: '#111',
    border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff',
    boxSizing: 'border-box', fontSize: '0.9rem',
  };
  const lbl = { display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const card = { background: '#1a1a2e', borderRadius: 14, padding: 24, marginBottom: 20, border: '1px solid #2a2a4a' };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 24 }}>
        <span className="page-title">Admin Management</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <span style={{ color: '#2ecc71', fontSize: '0.88rem' }}>✓ {msg}</span>}
          {err && <span style={{ color: '#e74c3c', fontSize: '0.88rem' }}>✕ {err}</span>}
          <button
            onClick={() => { setShowForm(v => !v); setForm({ username: '', password: '' }); }}
            style={{
              padding: '9px 18px', background: showForm ? 'transparent' : '#2ecc71',
              border: showForm ? '1px solid #444' : 'none',
              color: showForm ? '#aaa' : '#000',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
            }}
          >
            {showForm ? 'Cancel' : '+ Add Admin'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#0d1f35', border: '1px solid #1a4a6a', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#5dade2',
      }}>
        <strong>How it works:</strong> Each admin has their own username and password to log in to this panel.
        You can add staff or partners as admins and remove them at any time.
        Passwords are encrypted — nobody can read them, not even you.
      </div>

      {/* Add admin form */}
      {showForm && (
        <div style={{ ...card, border: '1px solid #2ecc7133', background: '#0d1f1a' }}>
          <h3 style={{ color: '#fff', marginBottom: 18, fontSize: '1rem' }}>Add New Admin</h3>
          <form onSubmit={addAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Username *</label>
                <input
                  style={inp} type="text" required
                  value={form.username} onChange={set('username')}
                  placeholder="e.g. manager1"
                  autoComplete="off"
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inp, paddingRight: 52 }}
                    type={showPw ? 'text' : 'password'}
                    required minLength={6}
                    value={form.password} onChange={set('password')}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', fontSize: '0.78rem', fontWeight: 600, padding: 0,
                  }}>{showPw ? 'Hide' : 'Show'}</button>
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '10px 24px', background: saving ? '#1a5c35' : '#2ecc71',
              border: 'none', color: '#000', fontWeight: 700,
              borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Adding…' : 'Add Admin'}
            </button>
          </form>
        </div>
      )}

      {/* Admins list */}
      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
      {!loading && admins.length === 0 && (
        <p style={{ color: '#555', textAlign: 'center', padding: 40 }}>No admins found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {admins.map((a, i) => (
          <div key={a._id} style={{
            ...card, marginBottom: 0, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1px solid ${i === 0 ? '#2ecc7133' : '#2a2a4a'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: i === 0 ? '#0d2e1a' : '#0f2a3a',
                border: `2px solid ${i === 0 ? '#2ecc71' : '#3498db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i === 0 ? '#2ecc71' : '#5dade2',
                fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}>
                {a.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{a.username}</span>
                  {i === 0 && (
                    <span style={{
                      background: '#0d2e1a', color: '#2ecc71',
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, border: '1px solid #2ecc7133',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>Owner</span>
                  )}
                </div>
                <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 2 }}>
                  Added {fmtDate(a.createdAt)}
                </div>
              </div>
            </div>

            {/* Remove button — don't allow removing the first/owner admin */}
            {i !== 0 ? (
              <button
                onClick={() => removeAdmin(a._id, a.username)}
                disabled={deletingId === a._id}
                style={{
                  padding: '7px 16px', background: '#2e0d0d',
                  border: '1px solid #e74c3c44', color: '#e74c3c',
                  borderRadius: 8, cursor: deletingId === a._id ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                {deletingId === a._id ? 'Removing…' : 'Remove'}
              </button>
            ) : (
              <span style={{ color: '#555', fontSize: '0.78rem' }}>Cannot remove</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}