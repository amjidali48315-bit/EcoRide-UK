import { useState, useEffect, useRef } from 'react';
import axios from '../../axiosConfig';

const EMPTY = {
  name: '', category: 'E-Scooter', price: '', cost_price: '',
  city: '', description: '', badge: '', specs: '',
};

const imgSrc = i => { if (!i) return null; if (i.startsWith('http')) return i; return i; };

export default function AdminProducts() {
  const [products,      setProducts]      = useState([]);
  const [cities,        setCities]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState(EMPTY);
  const [stockByCity,   setStockByCity]   = useState({});
  const [editing,       setEditing]       = useState(null);
  const [imageFiles,    setImageFiles]    = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [msg,           setMsg]           = useState('');
  const [err,           setErr]           = useState('');
  const [saving,        setSaving]        = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    axios.get('/api/products', { withCredentials: true })
      .then(r => setProducts(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    axios.get('/api/cities', { withCredentials: true }).then(r => setCities(r.data)).catch(() => {});
  }, []);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setErr(''); } else { setErr(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  const parseSpecs = raw => {
    if (!raw?.trim()) return {};
    const obj = {};
    raw.split('\n').forEach(line => {
      const [k, ...v] = line.split(':');
      if (k?.trim()) obj[k.trim()] = v.join(':').trim();
    });
    return obj;
  };

  const specsToText = specs => {
    if (!specs) return '';
    const entries = specs instanceof Map ? [...specs.entries()] : Object.entries(specs);
    return entries.map(([k, v]) => `${k}:${v}`).join('\n');
  };

  const startEdit = p => {
    setEditing(p._id);
    setForm({
      name: p.name, category: p.category,
      price: p.price, cost_price: p.cost_price || '',
      city: p.city || '', description: p.description || '',
      badge: p.badge || '', specs: specsToText(p.specs),
    });
    const existing = (p.stock_by_city && typeof p.stock_by_city === 'object') ? p.stock_by_city : {};
    setStockByCity(existing);
    setImageFiles([]);
    const existingImages = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setImagePreviews(existingImages.map(imgSrc).filter(Boolean));
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null); setForm(EMPTY); setStockByCity({});
    setImageFiles([]); setImagePreviews([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { flash(false, 'Maximum 5 images allowed.'); return; }
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePreview = idx => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setErr(''); setMsg('');
    try {
      const data = new FormData();
      data.append('name',          form.name.trim());
      data.append('category',      form.category);
      data.append('price',         form.price || 0);
      data.append('cost_price',    form.cost_price || 0);
      data.append('city',          form.city || '');
      data.append('description',   form.description || '');
      data.append('badge',         form.badge || '');
      data.append('specs',         JSON.stringify(parseSpecs(form.specs)));
      data.append('stock_by_city', JSON.stringify(stockByCity));
      imageFiles.forEach(f => data.append('image_files', f));

      const cfg = { withCredentials: true };
      if (editing) { await axios.put(`/api/products/${editing}`, data, cfg); flash(true, 'Product updated.'); }
      else         { await axios.post('/api/products', data, cfg);            flash(true, 'Product added.'); }
      cancelEdit(); load();
    } catch (error) {
      flash(false, error.response?.data?.error || 'Failed to save product.');
    } finally { setSaving(false); }
  };

  const remove = async id => {
    if (!window.confirm('Delete this product?')) return;
    try { await axios.delete(`/api/products/${id}`, { withCredentials: true }); flash(true, 'Deleted.'); load(); }
    catch { flash(false, 'Failed to delete.'); }
  };

  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const totalValue = products.reduce((s, p) => s + ((p.cost_price || 0) * (p.stock || 0)), 0);

  const inp = { width: '100%', padding: '9px 12px', background: '#0d0d1a', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', fontSize: '0.9rem' };
  const lbl = { display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: 5, fontWeight: 600 };

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">{editing ? 'Edit Product' : 'Products'}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <span style={{ color: '#2ecc71', fontSize: '0.9rem' }}>✓ {msg}</span>}
          {err && <span style={{ color: '#e74c3c', fontSize: '0.9rem' }}>✕ {err}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Products', value: products.length,      color: '#2ecc71' },
          { label: 'Total Stock',    value: `${totalStock} units`, color: '#3498db' },
          { label: 'Stock Value',    value: `£${totalValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`, color: '#9b59b6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 10, padding: '12px 18px', border: `1px solid ${s.color}44` }}>
            <div style={{ color: s.color, fontSize: '1.5rem', fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.8rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 14, padding: 24, marginBottom: 28, border: '1px solid #2a2a4a' }}>
        <h3 style={{ color: '#fff', margin: '0 0 20px' }}>{editing ? 'Edit Product' : 'Add New Product'}</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Product Name *</label>
              <input style={inp} type="text" value={form.name} onChange={set('name')} placeholder="e.g. Lightning Pro X1" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Category *</label>
              <select style={inp} value={form.category} onChange={set('category')}>
                <option value="E-Scooter">E-Scooter</option>
                <option value="E-Bike">E-Bike</option>
                <option value="Deals">Deals</option>
                <option value="Child Gifts">Child Gifts</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Sale Price (£) *</label>
              <input style={inp} type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="299.99" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Cost Price (£)</label>
              <input style={inp} type="number" step="0.01" min="0" value={form.cost_price} onChange={set('cost_price')} placeholder="180.00" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Badge</label>
              <select style={inp} value={form.badge} onChange={set('badge')}>
                <option value="">None</option>
                <option value="New">New</option>
                <option value="Sale">Sale</option>
                <option value="Bestseller">Bestseller</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Primary City</label>
              <select style={inp} value={form.city} onChange={set('city')}>
                <option value="">— None —</option>
                {cities.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
              <label style={lbl}>Stock by City</label>
              {cities.length === 0 ? (
                <p style={{ color: '#e67e22', fontSize: '0.78rem', margin: '4px 0' }}>
                  No cities found. Go to <strong>City Management</strong> to add UK cities first.
                </p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {cities.map(city => (
                      <div key={city._id}>
                        <label style={{ ...lbl, fontSize: '0.73rem', color: '#777' }}>{city.name}</label>
                        <input style={inp} type="number" min="0"
                          value={stockByCity[city.name] ?? ''}
                          onChange={e => setStockByCity(prev => ({ ...prev, [city.name]: parseInt(e.target.value) || 0 }))}
                          placeholder="0" />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, color: '#555', fontSize: '0.75rem' }}>
                    Total: <strong style={{ color: '#2ecc71' }}>{Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0)} units</strong>
                  </div>
                </>
              )}
            </div>

            {/* Multiple Images */}
            <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
              <label style={lbl}>Product Images (up to 5)</label>
              <div>
                <input ref={fileRef} type="file" accept="image/*" id="img-upload" multiple
                  onChange={handleImageChange} style={{ display: 'none' }} />
                <label htmlFor="img-upload" style={{ display: 'inline-block', padding: '8px 16px', background: '#0f3460', color: '#5dade2', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #1a4a80' }}>
                  {imageFiles.length > 0 ? `✓ ${imageFiles.length} image(s) selected` : 'Choose Images'}
                </label>
                <p style={{ color: '#555', fontSize: '0.75rem', marginTop: 5 }}>JPG, PNG, WebP — max 5MB each — up to 5 images</p>
              </div>
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
                      <img src={src} alt={`preview ${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #3a3a5a' }} />
                      {imageFiles.length > 0 && (
                        <button type="button" onClick={() => removePreview(idx)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#e74c3c', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="Short product description..." />
            </div>

            <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
              <label style={lbl}>Specs (one per line: Key:Value)</label>
              <textarea style={{ ...inp, height: 100, resize: 'vertical' }} value={form.specs} onChange={set('specs')}
                placeholder={'Top Speed:25 km/h\nRange:35 km\nMotor:350W\nBattery:36V 10Ah\nWeight:12 kg'} />
            </div>

          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{ padding: '11px 28px', background: saving ? '#1a5c35' : '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
              {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} style={{ padding: '11px 24px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ color: '#fff', margin: 0 }}>All Products <span style={{ color: '#555', fontWeight: 400, fontSize: '0.85rem' }}>({products.length})</span></h3>
        </div>
        {loading && <p style={{ color: '#666', padding: 20 }}>Loading...</p>}
        {!loading && products.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No products yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => {
            const byCity = (p.stock_by_city && typeof p.stock_by_city === 'object') ? p.stock_by_city : {};
            const total  = p.stock || Object.values(byCity).reduce((s, v) => s + (Number(v) || 0), 0);
            const citySummary = Object.entries(byCity).filter(([, v]) => Number(v) > 0).map(([c, v]) => `${c}: ${v}`).join(', ');
            const allImages = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
            const src = allImages[0] ? imgSrc(allImages[0]) : null;
            return (
              <div key={p._id} style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: '#111', border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {src ? <img src={src} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                       : <span style={{ fontSize: 26 }}>🛵</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 2 }}>{p.category}{p.city ? ` · ${p.city}` : ''}{p.badge ? ` · ${p.badge}` : ''}</div>
                      {allImages.length > 1 && <div style={{ color: '#5dade2', fontSize: '0.7rem', marginTop: 2 }}>📷 {allImages.length} images</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ color: total === 0 ? '#e74c3c' : total <= 5 ? '#f39c12' : '#2ecc71', fontWeight: 800, fontSize: '1.1rem' }}>{total}</div>
                      <div style={{ color: '#555', fontSize: '0.65rem' }}>in stock</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', marginBottom: citySummary ? 6 : 8 }}>
                    <span style={{ color: '#2ecc71' }}>Sale: £{Number(p.price).toLocaleString()}</span>
                    <span style={{ color: '#e74c3c' }}>Cost: £{Number(p.cost_price || 0).toLocaleString()}</span>
                  </div>
                  {citySummary && <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: 8 }}>{citySummary}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(p)} style={{ flex: 1, padding: '7px', background: '#0f3460', border: 'none', color: '#5dade2', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Edit</button>
                    <button onClick={() => remove(p._id)} style={{ flex: 1, padding: '7px', background: '#3a0d0d', border: 'none', color: '#e74c3c', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
