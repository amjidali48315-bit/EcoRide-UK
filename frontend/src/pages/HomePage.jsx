import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCustomer } from '../context/CustomerContext';

const imgSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return image; // already a relative path like /images/...
};

const banners = [
  '/images/banner1.jpeg',
  '/images/banner2.jpeg',
  '/images/banner3.jpeg',
  '/images/banner4.jpeg',
  '/images/banner5.jpeg',
];

// ── Hero Slider ───────────────────────────────────────────────────────────
function Slider() {
  const [current, setCurrent] = useState(0);
  const show = useCallback((idx) => setCurrent((idx + banners.length) % banners.length), []);
  useEffect(() => {
    const t = setInterval(() => show(current + 1), 3000);
    return () => clearInterval(t);
  }, [current, show]);

  return (
    <section className="slider-container">
      <div className="slider">
        {banners.map((src, i) => (
          <img key={i} src={src} className={`slide ${i === current ? 'active' : ''}`} alt={`Banner ${i + 1}`} />
        ))}
      </div>
      <div className="slider-overlay">
        <div style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 800, color: '#fff',
          letterSpacing: '-1px', marginBottom: 8, textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          EcoRide <span style={{ color: '#2ecc71' }}>UK</span>
        </div>
        <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 400, marginBottom: 10, opacity: 0.9 }}>
          Premium Ride. Local UK Delivery.
        </h2>
        <p>Top-rated e-scooters and e-bikes delivered across the UK.</p>
        <Link to="/products" className="slider-btn">Shop Now</Link>
      </div>
      <div className="slider-dots">
        {banners.map((_, i) => (
          <button key={i} className={`slider-dot ${i === current ? 'active' : ''}`} onClick={() => show(i)} />
        ))}
      </div>
    </section>
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────
function Countdown({ expiresAt }) {
  const calc = () => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      over: false,
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (time.over) return (
    <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: '0.9rem', marginTop: 12 }}>
      This offer has ended
    </div>
  );

  const pad = n => String(n).padStart(2, '0');
  const box = (val, label) => (
    <div style={{
      background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '8px 12px',
      minWidth: 52, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pad(val)}</div>
      <div style={{ fontSize: '0.65rem', color: '#ccc', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div style={{ color: '#f39c12', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Offer Ends In
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {time.d > 0 && box(time.d, 'Days')}
        {box(time.h, 'Hours')}
        {box(time.m, 'Mins')}
        {box(time.s, 'Secs')}
      </div>
    </div>
  );
}

// ── Videos Section ───────────────────────────────────────────────────────
function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false);

  const thumb = video.thumbnail
    ? (video.thumbnail.startsWith('http') ? video.thumbnail : video.thumbnail)
    : video.auto_thumbnail || '';

  const videoSrc = video.video_file
    ? (video.video_file.startsWith('http') ? video.video_file : video.video_file)
    : null;

  return (
    <div style={{
      background: '#1a1a2e', borderRadius: 14, overflow: 'hidden',
      border: '1px solid #2a2a4a', transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(46,204,113,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Video player area */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
        {playing ? (
          video.embed_url ? (
            <iframe
              src={`${video.embed_url}?autoplay=1&rel=0`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : videoSrc ? (
            <video
              src={videoSrc}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              controls autoPlay
            />
          ) : null
        ) : (
          <>
            {/* Thumbnail */}
            {thumb ? (
              <img src={thumb} alt={video.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f3460, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#555', fontSize: '0.85rem' }}>No thumbnail</span>
              </div>
            )}
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(46,204,113,0.9)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(46,204,113,0.4)',
                transition: 'transform 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.1)'; e.currentTarget.style.background = '#2ecc71'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)'; e.currentTarget.style.background = 'rgba(46,204,113,0.9)'; }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="#000">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700 }}>{video.title}</h4>
        {video.description && (
          <p style={{ color: '#888', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{video.description}</p>
        )}
      </div>
    </div>
  );
}

function VideosSection({ videos }) {
  if (!videos || videos.length === 0) return null;
  return (
    <section style={{ background: '#0d0d1a', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            background: '#2ecc71', color: '#000', fontSize: '0.75rem', fontWeight: 700,
            padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '1px',
          }}>Watch</span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginTop: 12, marginBottom: 8 }}>
            See Our Scooters in Action
          </h2>
          <p style={{ color: '#888', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto' }}>
            Watch reviews, demos and delivery videos from EcoRide UK.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {videos.map(v => <VideoCard key={v._id} video={v} />)}
        </div>
      </div>
    </section>
  );
}

// ── Offers Section — stacked vertically, one after another ───────────────
function OffersSection({ offers }) {
  if (offers.length === 0) return (
    <section style={{ background: '#0a0a1a', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <span style={{ color: '#f39c12', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Special Offers
        </span>
        <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: '10px 0 12px' }}>
          No Offers Available
        </h2>
        <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: 1.7 }}>
          No offers are currently available. Check back soon — new deals are added regularly!
        </p>
      </div>
    </section>
  );

  return (
    <section style={{ background: '#0d0d1a' }}>

      {/* Section heading */}
      <div style={{ textAlign: 'center', padding: '48px 20px 24px' }}>
        <span style={{
          background: '#2ecc71', color: '#000', fontSize: '0.75rem', fontWeight: 700,
          padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '1px',
        }}>Special Offers</span>
        <h2 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginTop: 12, marginBottom: 0 }}>
          Exclusive Deals For You
        </h2>
      </div>

      {/* Each offer stacked below the previous one */}
      {offers.map((offer, index) => {
        const src = imgSrc(offer.image);
        return (
          <div key={offer._id} style={{ position: 'relative', width: '100%' }}>

            {/* Banner image — same full width as hero banners */}
            {src ? (
              <img
                src={src}
                alt={offer.title}
                style={{ width: '100%', minHeight: 360, maxHeight: 520, objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: '100%', minHeight: 360,
                background: index % 2 === 0
                  ? 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
                  : 'linear-gradient(135deg, #1a0a2e 0%, #16213e 100%)',
              }} />
            )}

            {/* Dark gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.1) 100%)',
            }} />

            {/* Offer number badge — top right */}
            {offers.length > 1 && (
              <div style={{
                position: 'absolute', top: 20, right: 24,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#aaa', fontSize: '0.8rem', padding: '4px 12px', borderRadius: 20,
              }}>
                {index + 1} / {offers.length}
              </div>
            )}

            {/* Content — left aligned, vertically centred */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              padding: 'clamp(24px, 5vw, 60px)',
            }}>
              <div style={{ maxWidth: 520 }}>

                {/* Label badge */}
                {offer.label && (
                  <span style={{
                    background: '#2ecc71', color: '#000', fontSize: '0.75rem', fontWeight: 800,
                    padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase',
                    letterSpacing: '1px', display: 'inline-block', marginBottom: 14,
                  }}>
                    {offer.label}
                  </span>
                )}

                {/* Discount */}
                {offer.discount && (
                  <div style={{
                    color: '#f39c12', fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                    fontWeight: 900, lineHeight: 1, marginBottom: 10,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}>
                    {offer.discount}
                  </div>
                )}

                {/* Title */}
                <h3 style={{
                  color: '#fff', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                  fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2,
                }}>
                  {offer.title}
                </h3>

                {/* Subtitle */}
                {offer.subtitle && (
                  <p style={{ color: '#ccc', fontSize: '0.95rem', marginBottom: 20, lineHeight: 1.5 }}>
                    {offer.subtitle}
                  </p>
                )}

                {/* Countdown timer */}
                {offer.expires_at && (
                  <div style={{ marginBottom: 24 }}>
                    <Countdown expiresAt={offer.expires_at} />
                  </div>
                )}

                {/* CTA button */}
                <Link to={offer.link || '/products'} style={{
                  display: 'inline-block', background: '#2ecc71', color: '#000',
                  fontWeight: 700, fontSize: '1rem', padding: '13px 32px',
                  borderRadius: 10, textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(46,204,113,0.4)',
                }}>
                  {offer.btn_text || 'Shop Now'} →
                </Link>
              </div>
            </div>

            {/* Decorative separator between offers */}
            {index < offers.length - 1 && (
              <div style={{
                background: '#0d0d1a',
                padding: '36px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  width: 300, height: 80,
                  background: 'radial-gradient(ellipse at center, rgba(46,204,113,0.15) 0%, transparent 70%)',
                  top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />
                <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'linear-gradient(to right, transparent, rgba(46,204,113,0.5))' }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'linear-gradient(135deg, #0f2a1a, #1a3a2a)',
                  border: '1px solid rgba(46,204,113,0.35)',
                  borderRadius: 30,
                  padding: '8px 20px',
                  boxShadow: '0 0 20px rgba(46,204,113,0.12)',
                }}>
                  <span style={{ color: '#2ecc71', fontSize: '1rem' }}></span>
                  <span style={{
                    color: '#2ecc71', fontSize: '0.72rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '1.5px',
                  }}>More Offers</span>
                  <span style={{ color: '#2ecc71', fontSize: '1rem' }}></span>
                </div>
                <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'linear-gradient(to left, transparent, rgba(46,204,113,0.5))' }} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ── Back to Top ───────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

// ── Guarantees ────────────────────────────────────────────────────────────
// ── Star display helper ───────────────────────────────────────────────────
function Stars({ rating, size = '1rem', interactive = false, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => interactive && onSelect && onSelect(n)}
          style={{
            fontSize: size, color: n <= rating ? '#f39c12' : '#333',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'color 0.1s',
          }}
        >★</span>
      ))}
    </div>
  );
}

// ── Reviews section ───────────────────────────────────────────────────────
function ReviewsSection() {
  const { customer, getToken } = useCustomer();

  const [reviews,          setReviews]          = useState([]);
  const [eligibleOrders,   setEligibleOrders]   = useState([]); // delivered + not yet reviewed
  const [loadingOrders,    setLoadingOrders]    = useState(false);
  const [showForm,         setShowForm]         = useState(false);
  const [selectedOrder,    setSelectedOrder]    = useState('');
  const [rating,           setRating]           = useState(0);
  const [hovered,          setHovered]          = useState(0);
  const [form,             setForm]             = useState({ name: '', message: '' });
  const [saving,           setSaving]           = useState(false);
  const [done,             setDone]             = useState(false);
  const [err,              setErr]              = useState('');

  // Always load approved reviews (everyone can see them)
  useEffect(() => {
    axios.get('/api/reviews').then(r => setReviews(r.data)).catch(() => {});
  }, []);

  // When customer logs in, fetch their delivered orders and already-reviewed order IDs
  useEffect(() => {
    if (!customer) { setEligibleOrders([]); return; }
    setLoadingOrders(true);
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get('/api/customers/my-orders', { headers }),
      axios.get('/api/reviews/mine',        { headers }).catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, reviewedRes]) => {
        const delivered   = (ordersRes.data || []).filter(o => o.status === 'Delivered');
        const reviewedIds = new Set((reviewedRes.data || []).map(String));
        const eligible    = delivered.filter(o => !reviewedIds.has(String(o._id)));
        setEligibleOrders(eligible);
        if (eligible.length > 0) setForm(f => ({ ...f, name: customer.full_name || '' }));
      })
      .catch(() => setEligibleOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [customer]);

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!selectedOrder)       { setErr('Please select an order.'); return; }
    if (!rating)              { setErr('Please select a star rating.'); return; }
    if (!form.name.trim())    { setErr('Please enter your name.'); return; }
    if (!form.message.trim()) { setErr('Please write a message.'); return; }
    setSaving(true); setErr('');
    try {
      await axios.post('/api/reviews',
        { order_id: selectedOrder, rating, name: form.name, message: form.message },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setDone(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not submit. Please try again.');
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setShowForm(false); setDone(false); setErr('');
    setRating(0); setSelectedOrder('');
    setForm({ name: customer?.full_name || '', message: '' });
  };

  const inp = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#fff', boxSizing: 'border-box', fontSize: '0.92rem', outline: 'none',
  };

  // ── What to show in place of the "Write a Review" button
  const renderCTA = () => {
    if (!customer) return (
      <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 8 }}>
        <Link to="/login" style={{ color: '#2ecc71' }}>Sign in</Link> and place an order to leave a review.
      </p>
    );
    if (loadingOrders) return (
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 8 }}>Checking your orders…</p>
    );
    if (eligibleOrders.length === 0) return (
      <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 8 }}>
        {customer ? 'You need a delivered order to write a review.' : ''}
      </p>
    );
    return (
      <button onClick={() => setShowForm(true)} style={{
        background: '#2ecc71', color: '#000', border: 'none',
        padding: '12px 28px', borderRadius: 30, fontWeight: 700,
        fontSize: '0.92rem', cursor: 'pointer', marginTop: 8,
      }}>★ Write a Review</button>
    );
  };

  return (
    <section style={{ background: '#0a0a1a', padding: '72px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ color: '#2ecc71', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
            What Our Customers Say
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, margin: '10px 0 8px' }}>
            Customer Reviews
          </h2>
          <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: 6 }}>
            Real experiences from real riders across the UK.
          </p>
          {!showForm && !done && renderCTA()}
        </div>

        {/* Approved review cards */}
        {reviews.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20, marginBottom: 48,
          }}>
            {reviews.slice(0, 9).map(r => (
              <div key={r._id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '20px 22px',
              }}>
                <Stars rating={r.rating} size="1.1rem" />
                <p style={{ color: '#ddd', fontSize: '0.9rem', lineHeight: 1.6, margin: '12px 0 14px', fontStyle: 'italic' }}>
                  "{r.message}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.88rem' }}>{r.name}</span>
                  <span style={{ color: '#555', fontSize: '0.75rem' }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 && (
          <p style={{ textAlign: 'center', color: '#555', marginBottom: 40 }}>
            No reviews yet — be the first to share your experience!
          </p>
        )}

        {/* Submit form */}
        {showForm && !done && (
          <div style={{
            maxWidth: 560, margin: '0 auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '32px 28px',
          }}>
            <h3 style={{ color: '#fff', margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 }}>
              Share Your Experience
            </h3>

            {/* Order selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>
                Select Your Order *
              </label>
              <select
                value={selectedOrder}
                onChange={e => setSelectedOrder(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}
              >
                <option value="">— Choose an order —</option>
                {eligibleOrders.map(o => (
                  <option key={o._id} value={o._id}>
                    {o.order_ref} — {o.product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Star selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>
                Your Rating *
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                      fontSize: '2rem', cursor: 'pointer', transition: 'transform 0.1s',
                      color: n <= (hovered || rating) ? '#f39c12' : '#333',
                      transform: n <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >★</span>
                ))}
                {rating > 0 && (
                  <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: 6 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Name *</label>
              <input style={inp} type="text" value={form.name} onChange={set('name')} placeholder="Your name" />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Your Review *</label>
              <textarea
                value={form.message} onChange={set('message')}
                placeholder="Tell us about your experience with EcoRide UK..."
                rows={4} style={{ ...inp, resize: 'vertical' }}
              />
            </div>

            {err && (
              <div style={{ background: '#2a0d0d', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {err}
              </div>
            )}

            <p style={{ color: '#555', fontSize: '0.76rem', marginBottom: 14 }}>
              Reviews are checked before publishing and your name will be shown once approved.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={resetForm} style={{
                flex: 1, padding: '11px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={submit} disabled={saving} style={{
                flex: 2, padding: '11px', background: saving ? '#1a5c35' : '#2ecc71',
                border: 'none', color: '#000', fontWeight: 700, borderRadius: 8,
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
              }}>
                {saving ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {done && (
          <div style={{
            maxWidth: 480, margin: '0 auto', textAlign: 'center',
            background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)',
            borderRadius: 16, padding: '36px 28px',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: '#2ecc71', fontWeight: 700, marginBottom: 8 }}>Thank You!</h3>
            <p style={{ color: '#aaa', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Your review has been submitted and will appear once approved by our team. We really appreciate your feedback!
            </p>
            <button onClick={resetForm} style={{
              marginTop: 20, background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              color: '#aaa', padding: '9px 22px', borderRadius: 8, cursor: 'pointer',
            }}>Close</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Contact banner ────────────────────────────────────────────────────────
function ContactBanner() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    axios.get('/api/settings').then(r => setInfo(r.data)).catch(() => {});
  }, []);

  const whatsappNum = info.social_whatsapp ? info.social_whatsapp.replace(/\D/g, '') : '';

  const items = [
    info.site_email && {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      label: 'Email',
      value: info.site_email,
      href: `mailto:${info.site_email}`,
      color: '#5dade2',
    },
    info.social_whatsapp && {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      label: 'WhatsApp',
      value: info.social_whatsapp,
      href: `https://wa.me/${whatsappNum}`,
      color: '#25D366',
    },
    info.site_hours && {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
        </svg>
      ),
      label: 'Business Hours',
      value: info.site_hours,
      href: null,
      color: '#f39c12',
    },
    info.site_address && {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      ),
      label: 'Address',
      value: info.site_address,
      href: `https://maps.google.com/?q=${encodeURIComponent(info.site_address)}`,
      color: '#e74c3c',
    },
  ].filter(Boolean);

  return (
    <section style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1a1a2e 100%)', padding: '64px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span style={{ color: '#5dade2', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Get In Touch
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, margin: '10px 0 10px' }}>
            Contact Us
          </h2>
          <p style={{ color: '#666', fontSize: '0.92rem' }}>
            We're here to help — reach out any way you prefer.
          </p>
        </div>

        {/* Contact cards grid */}
        {items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 36,
          }}>
            {items.map(item => {
              const inner = (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${item.color}30`,
                  borderTop: `3px solid ${item.color}`,
                  borderRadius: 12,
                  padding: '20px 18px',
                  textAlign: 'center',
                  transition: 'transform 0.15s, background 0.2s',
                  cursor: item.href ? 'pointer' : 'default',
                  height: '100%',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (item.href) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = `${item.color}0d`; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <div style={{ color: item.color, marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 600 }}>
                    {item.label}
                  </div>
                  <div style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {item.value}
                  </div>
                </div>
              );
              return item.href ? (
                <a key={item.label} href={item.href}
                  target={item.href.startsWith('mailto') ? '_self' : '_blank'}
                  rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </a>
              ) : (
                <div key={item.label}>{inner}</div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/contact" style={{
            display: 'inline-block', background: '#2ecc71', color: '#000',
            padding: '13px 36px', borderRadius: 30, fontWeight: 700,
            fontSize: '0.95rem', textDecoration: 'none',
          }}>
            Send Us a Message
          </Link>
        </div>
      </div>
    </section>
  );
}

const guarantees = [
  { img: '/images/free-shipping.png',    title: 'Fast Free Shipping',    desc: '1-3 business days delivery in the UK.' },
  { img: '/images/warranty.png',          title: '12 Months Warranty',    desc: 'Free replacements and tech support.' },
  { img: '/images/returns.png',           title: '30 Days Return',         desc: 'Full money back guarantee.' },
  { img: '/images/customer-support.png',  title: 'UK Customer Support',   desc: 'Expert local support available 24/7.' },
  { img: '/images/cod.png',               title: 'Cash on Delivery',       desc: 'Safe payment upon arrival.' },
];

// ── Main Page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers]     = useState([]);
  const [videos, setVideos]     = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [reviewMap, setReviewMap] = useState({});
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  // Scroll to offers section when redirected from products page
  useEffect(() => {
    if (searchParams.get('goto') === 'offers') {
      setTimeout(() => {
        document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [searchParams]);

  useEffect(() => { document.title = 'EcoRide UK — Premium E-Scooters & E-Bikes'; }, []);

  useEffect(() => {
    axios.get('/api/products').then(r => setProducts(r.data)).catch(console.error).finally(() => setLoading(false));
    axios.get('/api/reviews/summary').then(r => setReviewMap(r.data)).catch(() => {});
    axios.get('/api/offers').then(r => setOffers(r.data)).catch(console.error);
    axios.get('/api/videos').then(r => setVideos(r.data)).catch(console.error);
  }, []);

  const filtered   = category === 'all' ? products : products.filter(p => p.category === category);
  const badgeClass = badge => (badge || '').toLowerCase().replace(/\s/g, '');

  return (
    <>
      <Slider />

      {/* ── Products ──────────────────────────────────────────────── */}
      <section className="products-section">
        <div className="section-header">
          <span className="label">Our Collection</span>
          <h2>Ride In Style</h2>
          <p className="section-subtitle">Top-rated e-scooters and e-bikes, delivered free across the UK.</p>
        </div>

        <div className="filter-buttons">
          {[
            { value: 'all',         label: 'All',          local: true  },
            { value: 'E-Scooter',   label: 'E-Scooters',   local: true  },
            { value: 'E-Bike',      label: 'E-Bikes',      local: true  },
            { value: 'Deals',       label: 'Deals',        local: false },
            { value: 'Child Gifts', label: 'Child Gifts',  local: false },
            { value: 'Offers',      label: 'Offers',       local: false },
          ].map(cat => (
            <button
              key={cat.value}
              className={`filter-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => cat.local
                ? setCategory(cat.value)
                : navigate(`/products?category=${encodeURIComponent(cat.value)}`)
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {loading && <p style={{ color: '#aaa', textAlign: 'center', gridColumn: '1/-1', padding: '40px 0' }}>Loading products…</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ color: '#aaa', textAlign: 'center', gridColumn: '1/-1', padding: '40px 0' }}>No products available yet.</p>
          )}
          {filtered.map(p => {
            const src = imgSrc(p.image);
            return (
              <div key={p._id} className="product-card">
                {p.badge && <span className={`badge ${badgeClass(p.badge)}`}>{p.badge}</span>}
                <div className="img-wrap">
                  {src ? (
                    <img src={src} alt={p.name} onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#333' }}>No image</div>
                  )}
                </div>
                <div className="product-info">
                  <p className="category">{p.category}</p>
                  <h3>{p.name}</h3>
                  {reviewMap[p._id] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '4px 0 6px' }}>
                      <span style={{ letterSpacing: 1 }}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} style={{ color: n <= Math.round(reviewMap[p._id].avg) ? '#f39c12' : '#ccc', fontSize: '0.82rem' }}>★</span>
                        ))}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        {reviewMap[p._id].avg} ({reviewMap[p._id].count} review{reviewMap[p._id].count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                  <p className="prod-desc">{p.description}</p>
                  <div className="price-row">
                    <span className="price">£{Number(p.price).toLocaleString()}</span>
                    <Link to={`/products/${p._id}`} className="buy-btn">View Product</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Videos ────────────────────────────────────────────────── */}
      <VideosSection videos={videos} />

      {/* ── Offers — below products ────────────────────────────────── */}
      <div id="offers-section">
        <OffersSection offers={offers} />
      </div>

      {/* ── Reviews ───────────────────────────────────────────────── */}
      <ReviewsSection />

      {/* ── Contact banner ────────────────────────────────────────── */}
      <ContactBanner />

      {/* ── Guarantees ────────────────────────────────────────────── */}
      <section className="guarantees-container">
        {guarantees.map(g => (
          <div key={g.title} className="guarantee-card">
            <img src={g.img} alt={g.title} onError={e => { e.target.style.display = 'none'; }} />
            <h3>{g.title}</h3>
            <p>{g.desc}</p>
          </div>
        ))}
      </section>

      <BackToTop />
    </>
  );
}