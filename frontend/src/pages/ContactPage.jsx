import { useState, useEffect } from 'react';
import axios from '../axiosConfig';

const inp = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#fff',
  boxSizing: 'border-box', fontSize: '0.92rem',
  outline: 'none',
};

export default function ContactPage() {
  const [form,     setForm]     = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    document.title = 'Contact Us — EcoRide UK';
    axios.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim())    { setErr('Please enter your name.'); return; }
    if (!form.email.trim())   { setErr('Please enter your email.'); return; }
    if (!form.message.trim()) { setErr('Please enter your message.'); return; }
    setSaving(true); setErr('');
    try {
      await axios.post('/api/contacts', form);
      setDone(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not send message. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#0a0a1a', minHeight: '80vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ color: '#2ecc71', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Get in Touch
          </span>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, margin: '10px 0 12px' }}>
            Contact Us
          </h1>
          <p style={{ color: '#888', fontSize: '0.97rem', maxWidth: 480, margin: '0 auto' }}>
            Got a question about a product, an order, or anything else? Send us a message and our UK team will get back to you.
          </p>
        </div>

        <div className="contact-layout">

          {/* Info cards */}
          <div className="contact-info-cards">
            {[
              settings.site_email       && { icon: '✉', label: 'Email',    value: settings.site_email },
              settings.social_whatsapp  && { icon: '💬', label: 'WhatsApp', value: settings.social_whatsapp },
              settings.site_hours       && { icon: '🕐', label: 'Hours',    value: settings.site_hours },
              settings.site_address     && { icon: '📍', label: 'Address',  value: settings.site_address },
            ].filter(Boolean).map(c => (
              <div key={c.label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                <div>
                  <div style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.9rem' }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form / Success */}
          {done ? (
            <div style={{
              background: 'rgba(46,204,113,0.08)',
              border: '1px solid rgba(46,204,113,0.3)',
              borderRadius: 16, padding: '48px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✉️</div>
              <h2 style={{ color: '#2ecc71', fontWeight: 800, marginBottom: 10 }}>Message Sent!</h2>
              <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 24px' }}>
                Thanks for reaching out. Our team will get back to you within 24 hours.
              </p>
              <button onClick={() => { setDone(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }} style={{
                background: '#2ecc71', color: '#000', border: 'none',
                padding: '11px 28px', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
              }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '32px 28px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Full Name *</label>
                  <input style={inp} type="text" value={form.name} onChange={set('name')} placeholder="John Smith" required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Email Address *</label>
                  <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Phone (optional)</label>
                  <input style={inp} type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 7700 000000" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Subject</label>
                  <input style={inp} type="text" value={form.subject} onChange={set('subject')} placeholder="Order query, product info…" />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Message *</label>
                <textarea
                  value={form.message} onChange={set('message')}
                  placeholder="How can we help you?"
                  rows={5}
                  style={{ ...inp, resize: 'vertical' }}
                  required
                />
              </div>

              {err && (
                <div style={{ background: '#2a0d0d', border: '1px solid #e74c3c', color: '#e74c3c', padding: '9px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                  {err}
                </div>
              )}

              <button type="submit" disabled={saving} style={{
                width: '100%', padding: '13px', background: saving ? '#1a5c35' : '#2ecc71',
                border: 'none', color: saving ? '#555' : '#000',
                fontWeight: 700, borderRadius: 8, fontSize: '0.97rem',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}