import { useState, useEffect } from 'react';
import axios from '../../axiosConfig';

const cfg = { withCredentials: true };
const lbl = { display: 'block', color: '#aaa', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5 };
const inp = { width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 7, color: '#fff', boxSizing: 'border-box', fontSize: '0.9rem' };

export default function AdminCities() {
  const [cities,  setCities]  = useState([]);
  const [name,    setName]    = useState('');
  const [order,   setOrder]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const load = () => { axios.get('/api/cities/all', cfg).then(r => setCities(r.data)).catch(console.error); };
  useEffect(load, []);

  const flash = (ok, text) => { if (ok) { setMsg(text); setErr(''); } else { setErr(text); setMsg(''); } setTimeout(() => { setMsg(''); setErr(''); }, 3500); };

  const save = async e => {
    e.preventDefault();
    if (!name.trim()) { setErr('City name is required.'); return; }
    setSaving(true);
    try {
      if (editing) { await axios.put(`/api/cities/${editing._id}`, { name, sort_order: order || 0 }, cfg); flash(true, 'City updated.'); setEditing(null); }
      else         { await axios.post('/api/cities', { name, sort_order: order || 0 }, cfg); flash(true, `${name} added.`); }
      setName(''); setOrder(''); load();
    } catch (e) { flash(false, e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async city => {
    try { await axios.put(`/api/cities/${city._id}`, { name: city.name, is_active: !city.is_active, sort_order: city.sort_order }, cfg); load(); }
    catch { flash(false, 'Failed.'); }
  };

  const del = async id => {
    if (!window.confirm('Delete this city?')) return;
    try { await axios.delete(`/api/cities/${id}`, cfg); flash(true, 'City deleted.'); load(); }
    catch { flash(false, 'Failed.'); }
  };

  const startEdit = c => { setEditing(c); setName(c.name); setOrder(c.sort_order || 0); };
  const cancel    = ()  => { setEditing(null); setName(''); setOrder(''); };

  const seedDefaults = async () => {
    if (!window.confirm('Add 30 default UK cities?')) return;
    try { const r = await axios.post('/api/cities/seed', {}, cfg); flash(true, `${r.data.added} cities added.`); load(); }
    catch { flash(false, 'Seeding failed.'); }
  };

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">City Management</span>
        <button onClick={seedDefaults} style={{ background: '#0f3460', border: '1px solid #1a4a80', color: '#5dade2', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Add UK Defaults</button>
      </div>

      {(msg || err) && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: msg ? '#0d2e1a' : '#2e0d0d', border: `1px solid ${msg ? '#2ecc7144' : '#e74c3c44'}`, color: msg ? '#2ecc71' : '#e74c3c', fontSize: '0.88rem' }}>
          {msg || err}
        </div>
      )}

      <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: 20 }}>Cities here appear in all dropdowns — Products, Drivers, Orders, Stock.</p>

      {/* Form */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '18px', marginBottom: 20 }}>
        <h3 style={{ color: '#fff', marginBottom: 16, fontSize: '0.95rem' }}>{editing ? 'Edit City' : 'Add New City'}</h3>
        <form onSubmit={save}>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>City Name *</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Manchester" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Sort Order</label>
            <input style={{ ...inp, width: 100 }} type="number" min="0" value={order} onChange={e => setOrder(e.target.value)} placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>
              {saving ? '...' : editing ? 'Update City' : 'Add City'}
            </button>
            {editing && <button type="button" onClick={cancel} style={{ padding: '10px 16px', border: '1px solid #3a3a5a', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Cities list */}
      {cities.length === 0 && <p style={{ color: '#555', textAlign: 'center', padding: 20 }}>No cities yet — add one above or click "Add UK Defaults".</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cities.map(c => (
          <div key={c._id} style={{ background: '#1a1a2e', borderRadius: 10, border: '1px solid #2a2a4a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
              <div style={{ color: '#555', fontSize: '0.75rem', marginTop: 2 }}>Sort: {c.sort_order || 0}</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: c.is_active ? '#0d2e1a' : '#1a1a0d', color: c.is_active ? '#2ecc71' : '#888', border: `1px solid ${c.is_active ? '#2ecc7144' : '#44444444'}` }}>
              {c.is_active ? 'Active' : 'Inactive'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => startEdit(c)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #2a2a4a', background: 'none', color: '#5dade2', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
              <button onClick={() => toggleActive(c)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: c.is_active ? '#2a1a0d' : '#0d2e1a', color: c.is_active ? '#e67e22' : '#2ecc71', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                {c.is_active ? 'Off' : 'On'}
              </button>
              <button onClick={() => del(c._id)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#2a0d0d', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}