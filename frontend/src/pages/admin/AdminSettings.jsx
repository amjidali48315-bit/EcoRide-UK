import { useState, useEffect, useRef } from 'react';
import axios from '../../axiosConfig';

const DEFAULTS = {
  banner_title:    'Premium Ride. Local UK Delivery.',
  banner_subtitle: 'Top-rated e-scooters and e-bikes delivered free across the UK.',
  banner_btn_text: 'Shop Now',
  site_email:      'support@ecorideuk.com',
  site_phone:      '+44 7700 000000',
  site_hours:      'Mon - Sat: 9am - 6pm',
  site_address:    '',
  delivery_days:   '1-3 business days',
  social_whatsapp:  '',
  social_instagram: '',
  social_facebook:  '',
  social_tiktok:    '',
};

const EMPTY_OFFER = {
  title: '', subtitle: '', label: '', discount: '',
  expires_at: '', btn_text: 'Shop Now', sort_order: 0,
  price: '',
};

const imgSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return image;
};

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

// ── Countdown display (static, just formats the date nicely) ──────────────
function ExpiryPreview({ dateStr }) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return (
    <span style={{ color: '#f39c12', fontSize: '0.78rem', marginLeft: 8 }}>
      → {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function AdminSettings() {
  // ── Site settings ──────────────────────────────────────────────────────
  const [form, setForm]         = useState(DEFAULTS);
  const [settingsLoading, setSL] = useState(true);
  const [settingsMsg, setSMsg]  = useState('');
  const [settingsErr, setSErr]  = useState('');

  // ── Change Password ────────────────────────────────────────────────────
  const [pwForm, setPwForm]   = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwMsg, setPwMsg]     = useState('');
  const [pwErr, setPwErr]     = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  // ── Change Username ────────────────────────────────────────────────────
  const [unForm, setUnForm] = useState({ new_username: '', current_password: '' });
  const [unMsg,  setUnMsg]  = useState('');
  const [unErr,  setUnErr]  = useState('');
  const [unSaving, setUnSaving] = useState(false);
  const setUn = f => e => setUnForm(p => ({ ...p, [f]: e.target.value }));

  const changeUsername = async (e) => {
    e.preventDefault();
    setUnErr(''); setUnMsg('');
    if (!unForm.new_username.trim()) { setUnErr('Please enter a new username.'); return; }
    if (!unForm.current_password)    { setUnErr('Please enter your current password.'); return; }
    setUnSaving(true);
    try {
      const r = await axios.put('/api/admin/change-username', {
        new_username:     unForm.new_username.trim(),
        current_password: unForm.current_password,
      }, { withCredentials: true });
      setUnMsg('Username changed! Please log out and log in again with your new username.');
      setUnForm({ new_username: '', current_password: '' });
      if (r.data.token) localStorage.setItem('admin_token', r.data.token);
      setTimeout(() => { setUnMsg(''); }, 6000);
    } catch (err) {
      setUnErr(err.response?.data?.error || 'Failed to change username.');
      setTimeout(() => { setUnErr(''); }, 5000);
    } finally { setUnSaving(false); }
  };

  const setPw = f => e => setPwForm(p => ({ ...p, [f]: e.target.value }));

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');

    if (pwForm.new_password.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErr('New passwords do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await axios.put('/api/admin/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      }, { withCredentials: true });
      setPwMsg('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwSaving(false);
      setTimeout(() => { setPwMsg(''); setPwErr(''); }, 4000);
    }
  };

  // ── Offers ─────────────────────────────────────────────────────────────
  const [offers, setOffers]             = useState([]);
  const [offersLoading, setOL]          = useState(true);
  const [offerForm, setOfferForm]       = useState(EMPTY_OFFER);
  const [offerStockByCity, setOfferStockByCity] = useState({});
  const [cities, setCities]             = useState([]);
  const [editingOffer, setEditingOffer] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [offerMsg, setOfferMsg]         = useState('');
  const [offerErr, setOfferErr]         = useState('');
  const [offerSaving, setOfferSaving]   = useState(false);
  const fileRef = useRef();

  // Load settings
  useEffect(() => {
    axios.get('/api/settings')
      .then(r => setForm(f => ({ ...f, ...r.data })))
      .catch(console.error)
      .finally(() => setSL(false));
    axios.get('/api/cities', { withCredentials: true }).then(r => setCities(r.data)).catch(() => {});
  }, []);

  // Load offers
  const loadOffers = () => {
    setOL(true);
    axios.get('/api/offers/all', { withCredentials: true })
      .then(r => setOffers(r.data))
      .catch(console.error)
      .finally(() => setOL(false));
  };
  useEffect(() => { loadOffers(); }, []);

  // ── Site settings handlers ─────────────────────────────────────────────
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/settings', form, { withCredentials: true });
      setSMsg('Settings saved.'); setSErr('');
    } catch { setSErr('Failed to save.'); setSMsg(''); }
    setTimeout(() => { setSMsg(''); setSErr(''); }, 3500);
  };

  // ── Offer handlers ─────────────────────────────────────────────────────
  const setOf = f => e => setOfferForm(p => ({ ...p, [f]: e.target.value }));

  const flashOffer = (ok, text) => {
    if (ok) { setOfferMsg(text); setOfferErr(''); }
    else     { setOfferErr(text); setOfferMsg(''); }
    setTimeout(() => { setOfferMsg(''); setOfferErr(''); }, 4000);
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const startEditOffer = (o) => {
    setEditingOffer(o._id);
    setOfferForm({
      title: o.title, subtitle: o.subtitle || '', label: o.label || '',
      discount: o.discount || '',
      expires_at: o.expires_at ? new Date(o.expires_at).toISOString().slice(0, 16) : '',
      btn_text: o.btn_text || 'Shop Now',
      sort_order: o.sort_order || 0,
      price: o.price || '',
    });
    const existing = (o.stock_by_city && typeof o.stock_by_city === 'object') ? o.stock_by_city : {};
    if (Object.keys(existing).length === 0) {
      const m = {};
      if (o.stock_london > 0)     m['London']     = o.stock_london;
      if (o.stock_birmingham > 0) m['Birmingham']  = o.stock_birmingham;
      setOfferStockByCity(m);
    } else {
      setOfferStockByCity(existing);
    }
    setImageFile(null);
    setImagePreview(imgSrc(o.image) || '');
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelOfferEdit = () => {
    setEditingOffer(null);
    setOfferForm(EMPTY_OFFER);
    setOfferStockByCity({});
    setImageFile(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveOffer = async (e) => {
    e.preventDefault();
    setOfferSaving(true);
    try {
      const data = new FormData();
      Object.entries(offerForm).forEach(([k, v]) => data.append(k, v));
      data.append('stock_by_city', JSON.stringify(offerStockByCity));
      if (imageFile) data.append('image_file', imageFile);

      if (editingOffer) {
        await axios.put(`/api/offers/${editingOffer}`, data, { withCredentials: true });
        flashOffer(true, 'Offer updated.');
      } else {
        await axios.post('/api/offers', data, { withCredentials: true });
        flashOffer(true, 'Offer created.');
      }
      cancelOfferEdit();
      loadOffers();
    } catch (err) {
      flashOffer(false, err.response?.data?.error || 'Failed to save offer.');
    } finally {
      setOfferSaving(false);
    }
  };

  const toggleOffer = async (o) => {
    try {
      const data = new FormData();
      data.append('is_active', String(!o.is_active));
      await axios.put(`/api/offers/${o._id}`, data, { withCredentials: true });
      loadOffers();
    } catch { flashOffer(false, 'Failed to update.'); }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await axios.delete(`/api/offers/${id}`, { withCredentials: true });
      flashOffer(true, 'Offer deleted.');
      loadOffers();
    } catch { flashOffer(false, 'Failed to delete.'); }
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const inp = {
    width: '100%', padding: '9px 12px', background: '#0d0d1a',
    border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff',
    boxSizing: 'border-box', fontSize: '0.9rem',
  };
  const lbl = { display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: 5, fontWeight: 600 };
  const card = {
    background: '#1a1a2e', borderRadius: 14, padding: 24,
    marginBottom: 24, border: '1px solid #2a2a4a',
  };

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="admin-topbar" style={{ marginBottom: 24 }}>
        <span className="page-title">Settings</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {settingsMsg && <span style={{ color: '#2ecc71', fontSize: '0.9rem' }}>✓ {settingsMsg}</span>}
          {settingsErr && <span style={{ color: '#e74c3c', fontSize: '0.9rem' }}>✕ {settingsErr}</span>}
        </div>
      </div>

      {/* ── Site Settings form ─────────────────────────────────────── */}
      {!settingsLoading && (
        <form onSubmit={saveSettings}>
          <div style={card}>
            <h3 style={{ color: '#fff', marginBottom: 20 }}>Hero Banner Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label style={lbl}>Banner Headline</label>
                <input style={inp} type="text" value={form.banner_title || ''} onChange={set('banner_title')} placeholder="Premium Ride. Local UK Delivery." />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label style={lbl}>Banner Subtitle</label>
                <input style={inp} type="text" value={form.banner_subtitle || ''} onChange={set('banner_subtitle')} placeholder="Top-rated e-scooters…" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Button Text</label>
                <input style={inp} type="text" value={form.banner_btn_text || ''} onChange={set('banner_btn_text')} placeholder="Shop Now" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Contact Settings</h3>
            <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 20 }}>
              This information is displayed in the Contact Us section on the homepage and in the footer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Email Address</label>
                <input style={inp} type="text" value={form.site_email || ''} onChange={set('site_email')} placeholder="support@ecorideuk.com" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>WhatsApp Number</label>
                <input style={inp} type="text" value={form.social_whatsapp || ''} onChange={set('social_whatsapp')} placeholder="+44 7700 000000" />
                <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 3 }}>Customers can message you directly on WhatsApp</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Business Hours</label>
                <input style={inp} type="text" value={form.site_hours || ''} onChange={set('site_hours')} placeholder="Mon - Sat: 9am - 6pm" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Phone Number</label>
                <input style={inp} type="text" value={form.site_phone || ''} onChange={set('site_phone')} placeholder="+44 7700 000000" />
              </div>
              <div style={{ marginBottom: 16, gridColumn: '1/-1' }}>
                <label style={lbl}>Business Address</label>
                <input style={inp} type="text" value={form.site_address || ''} onChange={set('site_address')} placeholder="123 High Street, London, UK" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Delivery Timeframe</label>
                <input style={inp} type="text" value={form.delivery_days || ''} onChange={set('delivery_days')} placeholder="1-3 business days" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Social Media</h3>
            <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 20 }}>
              Icons appear in the footer under Contact Us. Leave blank to hide a platform.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
              {[
                { label: 'Instagram Handle', field: 'social_instagram', placeholder: 'ecorideuk', hint: 'Without the @ symbol' },
                { label: 'Facebook Page',    field: 'social_facebook',  placeholder: 'ecorideuk', hint: 'Page name or full URL' },
                { label: 'TikTok Username',  field: 'social_tiktok',    placeholder: 'ecorideuk', hint: 'Without the @ symbol' },
              ].map(f => (
                <div key={f.field} style={{ marginBottom: 16 }}>
                  <label style={lbl}>{f.label}</label>
                  <input style={inp} type="text" value={form[f.field] || ''} onChange={set(f.field)} placeholder={f.placeholder} />
                  <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 3 }}>{f.hint}</div>
                </div>
              ))}
            </div>
          </div>


          {/* ── Change Username ──────────────────────────────────────── */}
          <div style={card}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Change Username</h3>
            <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 20 }}>
              Update your admin login username. You will need your current password to confirm.
            </p>
            {unMsg && (
              <div style={{ background: '#0d2e1a', border: '1px solid #2ecc7144', borderRadius: 8, padding: '10px 14px', color: '#2ecc71', marginBottom: 14, fontSize: '0.88rem' }}>
                {unMsg}
              </div>
            )}
            {unErr && (
              <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c44', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', marginBottom: 14, fontSize: '0.88rem' }}>
                {unErr}
              </div>
            )}
            <form onSubmit={changeUsername}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>New Username</label>
                <input style={inp} type="text" value={unForm.new_username} onChange={setUn('new_username')} placeholder="Enter new username" required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Current Password (to confirm)</label>
                <input style={inp} type="password" value={unForm.current_password} onChange={setUn('current_password')} placeholder="Enter your current password" required />
              </div>
              <button type="submit" disabled={unSaving} style={{ padding: '11px 28px', background: unSaving ? '#1a3a5c' : '#3498db', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: unSaving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                {unSaving ? 'Changing...' : 'Change Username'}
              </button>
            </form>
          </div>

          {/* ── Change Password ──────────────────────────────────────── */}
          <div style={card}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Change Password</h3>
            <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 20 }}>
              Update your admin login password. You will need your current password to make changes.
            </p>
            {pwMsg && (
              <div style={{ background: '#0d2e1a', border: '1px solid #2ecc7144', borderRadius: 8, padding: '10px 14px', color: '#2ecc71', marginBottom: 14, fontSize: '0.88rem' }}>
                ✓ {pwMsg}
              </div>
            )}
            {pwErr && (
              <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c44', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', marginBottom: 14, fontSize: '0.88rem' }}>
                ✕ {pwErr}
              </div>
            )}
            <form onSubmit={changePassword}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
                {[
                  { label: 'Current Password',     field: 'current_password', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                  { label: 'New Password',          field: 'new_password',     show: showNew,     toggle: () => setShowNew(v => !v) },
                  { label: 'Confirm New Password',  field: 'confirm_password', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                ].map(({ label, field, show, toggle }) => (
                  <div key={field} style={{ marginBottom: 14 }}>
                    <label style={lbl}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={{ ...inp, paddingRight: 44 }}
                        type={show ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={setPw(field)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={toggle}
                        tabIndex={-1}
                        aria-label={show ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#888', display: 'flex', alignItems: 'center', padding: 0,
                        }}
                      >
                        <EyeIcon open={show} />
                      </button>
                    </div>
                    {field === 'new_password' && (
                      <p style={{ color: '#555', fontSize: '0.72rem', marginTop: 4, marginBottom: 0 }}>
                        Must be 8+ characters with letters, numbers, and symbols (e.g. !@#$%).
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" disabled={pwSaving} style={{
                padding: '10px 24px', background: pwSaving ? '#1a5c35' : '#2ecc71',
                border: 'none', color: '#000', fontWeight: 700, borderRadius: 8,
                cursor: pwSaving ? 'not-allowed' : 'pointer', marginTop: 4,
              }}>
                {pwSaving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <button type="submit" style={{
              padding: '11px 28px', background: '#2ecc71', border: 'none',
              color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer',
            }}>Save Settings</button>
            <button type="button" onClick={() => { if (window.confirm('Reset to defaults?')) setForm(DEFAULTS); }}
              style={{ padding: '11px 24px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>
              Reset Defaults
            </button>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════
          OFFERS SECTION
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid #2a2a4a', paddingTop: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0 }}>Special Offers</h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
              Offers appear on the homepage below the products, displayed one by one with a countdown timer.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {offerMsg && <span style={{ color: '#2ecc71', fontSize: '0.88rem' }}>✓ {offerMsg}</span>}
            {offerErr && <span style={{ color: '#e74c3c', fontSize: '0.88rem' }}>✕ {offerErr}</span>}
          </div>
        </div>

        {offersLoading && <p style={{ color: '#888' }}>Loading offers…</p>}
        {!offersLoading && offers.length === 0 && (
          <div style={{ color: '#555', padding: '20px 0', fontSize: '0.9rem' }}>
            No offers yet. Add your first offer below.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {offers.map(o => {
            const src = imgSrc(o.image);
            return (
              <div key={o._id} style={{
                background: '#111', borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${o.is_active ? '#2a3a2a' : '#3a2a2a'}`,
                display: 'flex', alignItems: 'stretch',
                opacity: o.is_active ? 1 : 0.6,
              }}>
                <div style={{
                  width: 140, flexShrink: 0, background: '#0d0d1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {src ? (
                    <img src={src} alt={o.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span style={{ fontSize: 36, color: '#333' }}>🖼</span>
                  )}
                </div>

                <div style={{ flex: 1, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {o.label && (
                      <span style={{
                        background: '#2ecc71', color: '#000', fontSize: '0.7rem',
                        fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{o.label}</span>
                    )}
                    <span style={{
                      background: o.is_active ? '#0d2e1a' : '#3a0d0d',
                      color: o.is_active ? '#2ecc71' : '#e74c3c',
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    }}>{o.is_active ? 'LIVE' : 'HIDDEN'}</span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{o.title}</div>
                  {o.discount && <div style={{ color: '#f39c12', fontWeight: 700, fontSize: '0.95rem' }}>{o.discount}</div>}
                  {o.subtitle && <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 2 }}>{o.subtitle}</div>}
                  {o.expires_at && (
                    <div style={{ color: '#e67e22', fontSize: '0.78rem', marginTop: 4 }}>
                      Expires: {new Date(o.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {o.product_id && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        background: '#0f3460', color: '#5dade2', fontSize: '0.7rem',
                        fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      }}>🛍 Product Linked</span>
                      <span style={{ color: '#555', fontSize: '0.72rem' }}>
                        /products/{String(o.product_id)}
                      </span>
                    </div>
                  )}
                  <div style={{ color: '#555', fontSize: '0.75rem', marginTop: 2 }}>Order: {o.sort_order}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, justifyContent: 'center' }}>
                  <button onClick={() => startEditOffer(o)} style={{
                    background: '#0f3460', border: 'none', color: '#5dade2',
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem',
                  }}>Edit</button>
                  <button onClick={() => toggleOffer(o)} style={{
                    background: o.is_active ? '#3a2a0d' : '#0d2e1a',
                    border: 'none', color: o.is_active ? '#f39c12' : '#2ecc71',
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem',
                  }}>{o.is_active ? 'Hide' : 'Show'}</button>
                  <button onClick={() => deleteOffer(o._id)} style={{
                    background: '#3a0d0d', border: 'none', color: '#e74c3c',
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem',
                  }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Add / Edit offer form ──────────────────────────────────── */}
        <div style={card}>
          <h3 style={{ color: '#fff', margin: '0 0 20px' }}>
            {editingOffer ? 'Edit Offer' : 'Add New Offer'}
          </h3>

          <form onSubmit={saveOffer}>
            <div style={{
              background: '#0d1f2e', border: '1px solid #1a4a6a', borderRadius: 10,
              padding: '10px 16px', marginBottom: 18, fontSize: '0.85rem', color: '#5dade2',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>🛍</span>
              <span>
                {editingOffer
                  ? 'Saving this offer will also update its linked product in the Products section.'
                  : 'A product will be automatically created and linked to this offer. The "Shop Now" button will go directly to that product page.'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Offer Title *</label>
                <input style={inp} type="text" value={offerForm.title} onChange={setOf('title')}
                  placeholder="e.g. Eid Special Offer" required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Label / Tag</label>
                <input style={inp} type="text" value={offerForm.label} onChange={setOf('label')}
                  placeholder="e.g. EID SPECIAL, SUMMER SALE, CLEARANCE" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Product Price (£) *</label>
                <input style={inp} type="number" min="0.01" step="0.01" value={offerForm.price} onChange={setOf('price')}
                  placeholder="e.g. 399.99" required />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                <label style={lbl}>Stock by City</label>
                {cities.length === 0 ? (
                  <p style={{ color: '#e67e22', fontSize: '0.78rem', margin: '4px 0' }}>
                    No cities found. Go to <strong>City Management</strong> to add UK cities first.
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                      {cities.map(city => (
                        <div key={city._id}>
                          <label style={{ ...lbl, fontSize: '0.72rem', color: '#777' }}>{city.name}</label>
                          <input style={inp} type="number" min="0"
                            value={offerStockByCity[city.name] ?? ''}
                            onChange={e => setOfferStockByCity(prev => ({ ...prev, [city.name]: parseInt(e.target.value) || 0 }))}
                            placeholder="0" />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 6, color: '#555', fontSize: '0.75rem' }}>
                      Total: <strong style={{ color: '#2ecc71' }}>{Object.values(offerStockByCity).reduce((s, v) => s + (Number(v) || 0), 0)} units</strong>
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Discount Text</label>
                <input style={inp} type="text" value={offerForm.discount} onChange={setOf('discount')}
                  placeholder="e.g. 20% OFF or £50 OFF" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Offer Expires At (Countdown Timer)
                  <ExpiryPreview dateStr={offerForm.expires_at} />
                </label>
                <input style={inp} type="datetime-local" value={offerForm.expires_at} onChange={setOf('expires_at')} />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label style={lbl}>Subtitle / Description</label>
                <input style={inp} type="text" value={offerForm.subtitle} onChange={setOf('subtitle')}
                  placeholder="e.g. Limited time deal on all e-scooters — don't miss out!" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Button Text</label>
                <input style={inp} type="text" value={offerForm.btn_text} onChange={setOf('btn_text')}
                  placeholder="Shop Now" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Display Order (lower = first)</label>
                <input style={inp} type="number" min="0" value={offerForm.sort_order} onChange={setOf('sort_order')} />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label style={lbl}>Offer Banner Image (same size as homepage banners)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 100, height: 56, borderRadius: 8, overflow: 'hidden',
                    border: '1px dashed #3a3a5a', background: '#0d0d1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImagePreview('')} />
                    ) : (
                      <span style={{ fontSize: 22, color: '#444' }}>🖼</span>
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
                      style={{ display: 'none' }} id="offer-img" />
                    <label htmlFor="offer-img" style={{
                      display: 'inline-block', padding: '8px 16px', background: '#0f3460',
                      color: '#5dade2', borderRadius: 8, cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 600, border: '1px solid #1a4a80',
                    }}>
                      {imageFile ? '✓ ' + imageFile.name : 'Choose Banner Image'}
                    </label>
                    <p style={{ color: '#555', fontSize: '0.75rem', marginTop: 5, marginBottom: 0 }}>
                      Recommended: same dimensions as your homepage banners. Max 8MB. This image is also used as the product image.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" disabled={offerSaving} style={{
                padding: '11px 28px', background: offerSaving ? '#1a5c35' : '#2ecc71',
                border: 'none', color: '#000', fontWeight: 700,
                borderRadius: 8, cursor: offerSaving ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
              }}>
                {offerSaving ? 'Saving…' : editingOffer ? 'Update Offer' : 'Add Offer'}
              </button>
              {editingOffer && (
                <button type="button" onClick={cancelOfferEdit} style={{
                  padding: '11px 24px', border: '1px solid #444',
                  background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer',
                }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}