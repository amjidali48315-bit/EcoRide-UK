import { useState, useEffect } from 'react';
import axios from '../axiosConfig';

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [msg,      setMsg]      = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/contacts', { withCredentials: true })
      .then(r => setContacts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleRead = async (id) => {
    try {
      await axios.put(`/api/contacts/${id}/read`, {}, { withCredentials: true });
      load();
    } catch { alert('Failed.'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/contacts/${id}`, { withCredentials: true });
      flash('Message deleted.');
      setExpanded(null);
      load();
    } catch { alert('Failed.'); }
  };

  const unread   = contacts.filter(c => !c.is_read).length;
  const filtered = filter === 'unread' ? contacts.filter(c => !c.is_read) : contacts;

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Contact Messages</span>
        {msg && <span className="success-msg">✓ {msg}</span>}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',  value: contacts.length, color: '#3498db' },
          { label: 'Unread', value: unread,           color: '#e74c3c' },
          { label: 'Read',   value: contacts.length - unread, color: '#2ecc71' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 12, border: `1px solid ${s.color}33`, padding: '14px 20px', minWidth: 110 }}>
            <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.76rem', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a4a', maxWidth: 280 }}>
        {[
          { id: 'all',    label: `All (${contacts.length})` },
          { id: 'unread', label: `Unread (${unread})` },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
            background: filter === t.id ? '#2ecc71' : '#111',
            color:      filter === t.id ? '#000' : '#666',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p style={{ color: '#666', padding: 20 }}>No messages found.</p>
        )}

        {filtered.map(c => {
          const isOpen = expanded === c._id;
          return (
            <div key={c._id} style={{
              background: '#1a1a2e',
              border: `1px solid ${!c.is_read ? '#3498db44' : '#2a2a4a'}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Row */}
              <div
                onClick={() => { setExpanded(isOpen ? null : c._id); if (!c.is_read) toggleRead(c._id); }}
                style={{
                  padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {!c.is_read && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3498db', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{c.name}</strong>
                      <span style={{ color: '#555', fontSize: '0.78rem' }}>{c.email}</span>
                      {c.phone && <span style={{ color: '#555', fontSize: '0.78rem' }}>{c.phone}</span>}
                    </div>
                    {c.subject && (
                      <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 2 }}>
                        Subject: {c.subject}
                      </div>
                    )}
                    {!isOpen && (
                      <div style={{ color: '#555', fontSize: '0.8rem', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                        {c.message}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ color: '#555', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</span>
                  <span style={{
                    padding: '2px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: c.is_read ? '#0d2e1a' : '#0d1e3a',
                    color:      c.is_read ? '#2ecc71' : '#3498db',
                  }}>
                    {c.is_read ? 'Read' : 'New'}
                  </span>
                  <span style={{ color: '#555', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid #1a1a3a' }}>
                  <div style={{ paddingTop: 14 }}>
                    <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      Full Message
                    </div>
                    <div style={{
                      background: '#111', borderRadius: 8, padding: '14px 16px',
                      color: '#ccc', fontSize: '0.9rem', lineHeight: 1.7,
                      whiteSpace: 'pre-wrap', marginBottom: 14,
                    }}>
                      {c.message}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject || 'Your enquiry')}`}
                        style={{
                          padding: '7px 16px', borderRadius: 7, background: '#0f3460',
                          color: '#5dade2', fontSize: '0.82rem', fontWeight: 600,
                          textDecoration: 'none', border: '1px solid #1a4a80',
                        }}>
                        Reply by Email
                      </a>
                      <button onClick={() => toggleRead(c._id)} style={{
                        padding: '7px 14px', borderRadius: 7, border: '1px solid #2a2a4a',
                        background: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem',
                      }}>
                        Mark as {c.is_read ? 'Unread' : 'Read'}
                      </button>
                      <button onClick={() => del(c._id)} style={{
                        padding: '7px 12px', borderRadius: 7, border: 'none',
                        background: '#2a0d0d', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}