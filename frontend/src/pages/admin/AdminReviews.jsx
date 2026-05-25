import { useState, useEffect } from 'react';
import axios from '../../axiosConfig';

function Stars({ rating }) {
  return <span>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= rating ? '#f39c12' : '#333', fontSize: '1rem' }}>★</span>)}</span>;
}

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [msg,     setMsg]     = useState('');

  const load = () => { setLoading(true); axios.get('/api/reviews/all', { withCredentials: true }).then(r => setReviews(r.data)).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleApprove = async id => {
    try { await axios.put(`/api/reviews/${id}/approve`, {}, { withCredentials: true }); flash('Review updated.'); load(); }
    catch { alert('Failed.'); }
  };

  const del = async id => {
    if (!window.confirm('Delete this review?')) return;
    try { await axios.delete(`/api/reviews/${id}`, { withCredentials: true }); flash('Deleted.'); load(); }
    catch { alert('Failed.'); }
  };

  const filtered = filter === 'all' ? reviews : filter === 'pending' ? reviews.filter(r => !r.approved) : reviews.filter(r => r.approved);
  const pending  = reviews.filter(r => !r.approved).length;

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Reviews</span>
        {msg && <span className="success-msg">✓ {msg}</span>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total',      value: reviews.length,                          color: '#3498db' },
          { label: 'Pending',    value: pending,                                 color: '#f39c12' },
          { label: 'Approved',   value: reviews.filter(r => r.approved).length,  color: '#2ecc71' },
          { label: 'Avg Rating', value: reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) + ' ★' : '—', color: '#f39c12' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 12, border: `1px solid ${s.color}33`, padding: '14px 16px' }}>
            <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.76rem', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
        {[['all',`All (${reviews.length})`],['pending',`Pending (${pending})`],['approved',`Approved (${reviews.filter(r=>r.approved).length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: filter === id ? '#2ecc71' : '#111', color: filter === id ? '#000' : '#666' }}>{label}</button>
        ))}
      </div>

      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
      {!loading && filtered.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No reviews found.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r._id} style={{ background: '#1a1a2e', borderRadius: 12, border: `1px solid ${r.approved ? '#2a2a4a' : '#f39c1233'}`, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{r.name}</div>
                <Stars rating={r.rating} />
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: r.approved ? '#0d2e1a' : '#2a1a0d', color: r.approved ? '#2ecc71' : '#f39c12', border: `1px solid ${r.approved ? '#2ecc7144' : '#f39c1244'}`, whiteSpace: 'nowrap' }}>
                {r.approved ? 'Approved' : 'Pending'}
              </span>
            </div>

            <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.6, margin: '10px 0', background: '#111', borderRadius: 8, padding: '10px 12px' }}>{r.message}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#555', fontSize: '0.75rem' }}>
                {r.email && <span style={{ marginRight: 8 }}>{r.email}</span>}
                {fmtDate(r.created_at)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleApprove(r._id)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', background: r.approved ? '#2a1a0d' : '#0d2e1a', color: r.approved ? '#f39c12' : '#2ecc71', fontSize: '0.8rem', fontWeight: 600 }}>
                  {r.approved ? 'Unapprove' : 'Approve'}
                </button>
                <button onClick={() => del(r._id)} style={{ padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#2a0d0d', color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}