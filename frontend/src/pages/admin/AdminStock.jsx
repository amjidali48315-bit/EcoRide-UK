import { useState, useEffect } from 'react';
import axios from 'axios';

const cfg = { withCredentials: true };

export default function AdminStock() {
  const [products,   setProducts]   = useState([]);
  const [cities,     setCities]     = useState([]);
  const [updates,    setUpdates]    = useState({});
  const [saving,     setSaving]     = useState({});
  const [msg,        setMsg]        = useState('');
  const [filter,     setFilter]     = useState('all');
  const [cityFilter, setCityFilter] = useState('All');

  useEffect(() => {
    axios.get('/api/products', cfg).then(r => setProducts(r.data)).catch(console.error);
    axios.get('/api/cities', cfg).then(r => setCities(r.data)).catch(() => {});
  }, []);

  const getStockByCity = p => {
    if (p.stock_by_city && typeof p.stock_by_city === 'object' && Object.keys(p.stock_by_city).length > 0) return p.stock_by_city;
    const legacy = {};
    if ((p.stock_london || 0) > 0)     legacy['London']     = p.stock_london;
    if ((p.stock_birmingham || 0) > 0) legacy['Birmingham'] = p.stock_birmingham;
    return legacy;
  };

  const getCityVal = (p, city) => { const current = updates[p._id] || getStockByCity(p); return current[city] ?? 0; };

  const setCity = (id, city, val) => {
    setUpdates(u => {
      const existing = u[id] || getStockByCity(products.find(p => p._id === id) || {});
      return { ...u, [id]: { ...existing, [city]: parseInt(val) || 0 } };
    });
  };

  const saveProduct = async p => {
    setSaving(s => ({ ...s, [p._id]: true }));
    try {
      const stockByCity = updates[p._id] || getStockByCity(p);
      const total = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);
      const data = new FormData();
      data.append('stock_by_city', JSON.stringify(stockByCity));
      data.append('name', p.name); data.append('category', p.category); data.append('price', p.price);
      await axios.put(`/api/products/${p._id}`, data, cfg);
      setProducts(ps => ps.map(x => x._id === p._id ? { ...x, stock_by_city: stockByCity, stock: total } : x));
      setUpdates(u => { const n = { ...u }; delete n[p._id]; return n; });
      setMsg(`${p.name} updated.`); setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Save failed.'); setTimeout(() => setMsg(''), 3000); }
    finally { setSaving(s => ({ ...s, [p._id]: false })); }
  };

  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const totalValue = products.reduce((s, p) => s + ((p.cost_price || 0) * (p.stock || 0)), 0);
  const lowStock   = products.filter(p => (p.stock || 0) <= 3).length;

  const filtered = products.filter(p => {
    if (filter === 'low' && (p.stock || 0) > 3) return false;
    if (filter === 'out' && (p.stock || 0) > 0)  return false;
    if (cityFilter !== 'All') { const byCity = getStockByCity(p); return (byCity[cityFilter] || 0) > 0; }
    return true;
  });

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Stock</span>
        {msg && <span style={{ color: '#2ecc71', fontSize: '0.88rem' }}>✓ {msg}</span>}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Stock',  value: `${totalStock} units`, color: '#2ecc71' },
          { label: 'Stock Value',  value: `£${totalValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`, color: '#3498db' },
          { label: 'Low Stock',   value: lowStock,               color: '#f39c12' },
          { label: 'Cities',      value: cities.length,          color: '#9b59b6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.76rem', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
        {[['all','All'],['low','Low (≤3)'],['out','Out of Stock']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: filter === id ? '#2ecc71' : '#111', color: filter === id ? '#000' : '#666' }}>{label}</button>
        ))}
      </div>

      {/* City filter — scrollable pill row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', ...cities.map(c => c.name)].map(c => (
          <button key={c} onClick={() => setCityFilter(c)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${cityFilter === c ? '#9b59b6' : '#2a2a4a'}`, background: cityFilter === c ? '#1a0f30' : 'transparent', color: cityFilter === c ? '#a569bd' : '#666', fontWeight: cityFilter === c ? 700 : 400, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{c}</button>
        ))}
      </div>

      {cities.length === 0 && (
        <div style={{ background: '#2a1a0d', border: '1px solid #e67e22', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#e67e22', fontSize: '0.88rem' }}>
          No cities configured. Go to <strong>City Management</strong> first.
        </div>
      )}

      {filtered.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No products match the current filters.</p>}

      {/* Product stock cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(p => {
          const total   = cities.reduce((s, c) => s + (Number(getCityVal(p, c.name)) || 0), 0);
          const isDirty = !!updates[p._id];
          return (
            <div key={p._id} style={{ background: isDirty ? 'rgba(46,204,113,0.06)' : '#1a1a2e', borderRadius: 12, border: `1px solid ${isDirty ? '#2ecc7144' : '#2a2a4a'}`, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 2 }}>{p.category}{p.city ? ` · ${p.city}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: total === 0 ? '#e74c3c' : total <= 3 ? '#f39c12' : '#2ecc71', fontWeight: 800, fontSize: '1.3rem', fontFamily: 'Rajdhani, sans-serif' }}>{total}</div>
                  <div style={{ color: '#555', fontSize: '0.7rem' }}>total units</div>
                </div>
              </div>

              {/* City inputs — 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: isDirty ? 12 : 0 }}>
                {cities.map(c => {
                  const val = getCityVal(p, c.name);
                  return (
                    <div key={c._id}>
                      <div style={{ color: '#666', fontSize: '0.72rem', marginBottom: 4 }}>{c.name}</div>
                      <input type="number" min="0" value={val} onChange={e => setCity(p._id, c.name, e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#111', border: `1px solid ${val === 0 ? '#3a1a1a' : val <= 3 ? '#3a2a0d' : '#1a3a1a'}`, borderRadius: 7, color: val === 0 ? '#e74c3c' : val <= 3 ? '#f39c12' : '#2ecc71', textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>
                  );
                })}
              </div>

              {isDirty && (
                <button onClick={() => saveProduct(p)} disabled={saving[p._id]} style={{ width: '100%', padding: '10px', background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.92rem' }}>
                  {saving[p._id] ? 'Saving…' : '✓ Save Changes'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}