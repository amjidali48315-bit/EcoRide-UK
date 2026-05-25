import { useState, useEffect } from 'react';
import axios from '../../axiosConfig';

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminDrivers() {
  const [drivers,    setDrivers]    = useState([]);
  const [cities,     setCities]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [msg,        setMsg]        = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '', payment_per_mile: 1.5 });
  const [locRequests,  setLocRequests]  = useState([]);
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [locMsg,       setLocMsg]       = useState('');

  const cfg = { withCredentials: true };

  const load = () => {
    setLoading(true);
    axios.get('/api/drivers', cfg).then(r => setDrivers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  const loadLocRequests = () => {
    axios.get('/api/drivers/admin/location-requests?status=Pending', cfg).then(r => setLocRequests(r.data)).catch(() => {});
  };

  useEffect(() => {
    load(); loadLocRequests();
    axios.get('/api/cities', cfg).then(r => setCities(r.data)).catch(() => {});
    const iv = setInterval(loadLocRequests, 30000);
    return () => clearInterval(iv);
  }, []);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const approveLocation = async id => {
    try {
      await axios.put(`/api/drivers/admin/location-requests/${id}/approve`, {}, cfg);
      setLocMsg('Location approved.'); setTimeout(() => setLocMsg(''), 4000);
      loadLocRequests(); load();
    } catch (e) { alert(e.response?.data?.error || 'Failed.'); }
  };

  const rejectLocation = async () => {
    if (!rejectId) return;
    try {
      await axios.put(`/api/drivers/admin/location-requests/${rejectId}/reject`, { reason: rejectReason }, cfg);
      setLocMsg('Rejected.'); setTimeout(() => setLocMsg(''), 4000);
      setRejectId(null); setRejectReason(''); loadLocRequests();
    } catch (e) { alert(e.response?.data?.error || 'Failed.'); }
  };

  const openCreate = () => { setEditDriver(null); setForm({ name: '', email: '', password: '', phone: '', city: 'London', payment_per_mile: 1.5 }); setShowForm(true); };
  const openEdit   = d  => { setEditDriver(d); setForm({ name: d.name, email: d.email, password: '', phone: d.phone, city: d.city, payment_per_mile: d.payment_per_mile }); setShowForm(true); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editDriver) await axios.put(`/api/drivers/${editDriver._id}`, form, cfg);
      else            await axios.post('/api/drivers', form, cfg);
      setMsg(editDriver ? 'Driver updated.' : 'Driver created.'); setTimeout(() => setMsg(''), 3000);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save driver.'); }
  };

  const toggleActive = async driver => {
    try { await axios.put(`/api/drivers/${driver._id}`, { ...driver, is_active: !driver.is_active }, cfg); load(); }
    catch { alert('Failed.'); }
  };

  const inp = { width: '100%', padding: '10px 12px', background: '#0d0d1a', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', marginBottom: 12, fontSize: '0.9rem' };
  const lbl = { display: 'block', color: '#aaa', fontSize: '0.78rem', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 };

  return (
    <>
      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: 24, maxWidth: 420, width: '100%', border: '1px solid #e74c3c44' }}>
            <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: '1rem' }}>Reject Location Request</h3>
            <input type="text" placeholder="Reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', marginBottom: 16, fontSize: '0.9rem' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} style={{ flex: 1, padding: '10px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={rejectLocation} style={{ flex: 1, padding: '10px', background: '#e74c3c', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, maxWidth: 500, width: '100%', border: '1px solid #2a2a4a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', margin: 0 }}>{editDriver ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={save}>
              <label style={lbl}>Full Name</label>
              <input style={inp} type="text" value={form.name} onChange={set('name')} placeholder="Ahmed Khan" required />
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="driver@example.com" required={!editDriver} disabled={!!editDriver} />
              <label style={lbl}>Password {editDriver && '(leave blank to keep)'}</label>
              <input style={inp} type="password" value={form.password} onChange={set('password')} placeholder={editDriver ? 'Leave blank' : 'Min 6 chars'} required={!editDriver} />
              <label style={lbl}>Phone</label>
              <input style={inp} type="text" value={form.phone} onChange={set('phone')} placeholder="07700 000000" />
              <label style={lbl}>City</label>
              <select style={inp} value={form.city} onChange={set('city')}>
                <option value="">— Select City —</option>
                {cities.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <label style={lbl}>Pay Rate (£/mile)</label>
              <input style={inp} type="number" step="0.1" min="0" value={form.payment_per_mile} onChange={set('payment_per_mile')} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>{editDriver ? 'Save Changes' : 'Create Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location requests */}
      {locRequests.length > 0 && (
        <div style={{ background: '#1a1200', border: '1px solid #f39c1244', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ background: '#f39c12', color: '#000', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{locRequests.length}</span>
            <span style={{ color: '#f39c12', fontWeight: 700 }}>Pending Location Requests</span>
            {locMsg && <span style={{ color: '#2ecc71', fontSize: '0.83rem', marginLeft: 'auto' }}>✓ {locMsg}</span>}
          </div>
          {locRequests.map(req => (
            <div key={req._id} style={{ background: '#111', borderRadius: 10, padding: '14px', marginBottom: 10, border: '1px solid #2a2a0a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', border: '2px solid #f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f39c12', fontWeight: 800, flexShrink: 0 }}>{(req.driver_id?.name || 'D')[0].toUpperCase()}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{req.driver_id?.name || '—'}</div>
                  <div style={{ color: '#666', fontSize: '0.75rem' }}>{req.driver_id?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#888' }}>{req.current_postcode || 'None'}</span>
                <span style={{ color: '#555' }}>→</span>
                <span style={{ color: '#f39c12', fontWeight: 700, fontSize: '1rem', letterSpacing: 1 }}>{req.requested_postcode}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setRejectId(req._id); setRejectReason(''); }} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Reject</button>
                <button onClick={() => approveLocation(req._id)} style={{ flex: 2, padding: '9px', background: '#2ecc71', border: 'none', color: '#000', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>✓ Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Drivers</span>
        {msg && <span className="success-msg">✓ {msg}</span>}
        <button onClick={openCreate} style={{ background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, padding: '9px 18px', borderRadius: 8, cursor: 'pointer' }}>+ Add Driver</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Drivers', value: drivers.length,                                color: '#3498db' },
          { label: 'Active',        value: drivers.filter(d => d.is_active).length,        color: '#2ecc71' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontSize: '1.8rem', fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
      {!loading && drivers.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No drivers yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {drivers.map(d => (
          <div key={d._id} style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: d.is_active ? '#0d2e1a' : '#2e0d0d', border: `2px solid ${d.is_active ? '#2ecc71' : '#e74c3c'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.is_active ? '#2ecc71' : '#e74c3c', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {(d.name || 'D')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{d.name}</div>
                  <div style={{ color: '#888', fontSize: '0.75rem', marginTop: 2 }}>{d.email}</div>
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: d.is_active ? '#0d2e1a' : '#2e0d0d', color: d.is_active ? '#2ecc71' : '#e74c3c' }}>
                {d.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem', marginBottom: 12, paddingLeft: 54 }}>
              {d.phone && <span style={{ color: '#888' }}>📞 {d.phone}</span>}
              <span style={{ color: '#5dade2' }}>📍 {d.city || '—'}</span>
              {d.postcode && <span style={{ color: '#f39c12', fontFamily: 'monospace' }}>{d.postcode}</span>}
              <span style={{ color: '#e67e22' }}>£{Number(d.payment_per_mile).toFixed(2)}/mi</span>
              <span style={{ color: '#2ecc71', fontWeight: 700 }}>Earned: £{Number(d.total_earned).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, paddingLeft: 54 }}>
              <button onClick={() => openEdit(d)} style={{ flex: 1, padding: '8px', background: '#0f3460', border: 'none', color: '#5dade2', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit</button>
              <button onClick={() => toggleActive(d)} style={{ flex: 1, padding: '8px', background: d.is_active ? '#3a1010' : '#0d2e1a', border: 'none', color: d.is_active ? '#e74c3c' : '#2ecc71', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                {d.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}