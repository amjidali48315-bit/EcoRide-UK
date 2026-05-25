import { useState, useEffect, useCallback } from 'react';
import axios from '../../axiosConfig';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const load = useCallback((q = '') => {
    setLoading(true);
    axios.get('/api/admin/customers', { withCredentials: true })
      .then(r => {
        const all = r.data;
        if (q) {
          const ql = q.toLowerCase();
          setCustomers(all.filter(c => (c.full_name||'').toLowerCase().includes(ql) || (c.email||'').toLowerCase().includes(ql) || (c.phone||'').includes(ql)));
        } else setCustomers(all);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Customers</span>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="text" placeholder="Search by name, email or phone…" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
            style={{ flex: 1, padding: '10px 14px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
          <button onClick={() => load(search)} style={{ padding: '10px 18px', background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem' }}>Search</button>
          {search && <button onClick={() => { setSearch(''); load(''); }} style={{ padding: '10px 14px', border: '1px solid #3a3a5a', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>✕</button>}
        </div>
      </div>

      <div style={{ color: '#555', fontSize: '0.78rem', marginBottom: 12, paddingLeft: 4 }}>
        {customers.length} customer{customers.length !== 1 ? 's' : ''}
      </div>

      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
      {!loading && customers.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No customers found.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {customers.map((c, i) => (
          <div key={c._id} style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0f3460', border: '2px solid #1a4a80', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5dade2', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {(c.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{c.full_name || '—'}</div>
                  <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 2 }}>{c.email || '—'}</div>
                </div>
              </div>
              <span style={{ color: '#555', fontSize: '0.72rem' }}>#{i + 1}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', flexWrap: 'wrap', paddingLeft: 50 }}>
              {c.phone && <span style={{ color: '#888' }}>📞 {c.phone}</span>}
              {c.city  && <span style={{ color: '#5dade2' }}>📍 {c.city}</span>}
              {c.postcode && <span style={{ color: '#f39c12' }}>{c.postcode}</span>}
              <span style={{ color: '#555' }}>Joined {fmtDate(c.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}