import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axiosConfig';
import { useCustomer } from '../context/CustomerContext';

const STEPS = ['Pending', 'Assigned', 'Dispatched', 'Delivered'];

const stepIndex = (status) => ({
  pending: 0, accepted: 0, assigned: 1, dispatched: 2, delivered: 3,
}[status?.toLowerCase()] ?? 0);

const statusClass = (status) => ({
  Pending: 'pending', Accepted: 'processing', Assigned: 'processing',
  Dispatched: 'dispatched', Delivered: 'delivered', Cancelled: 'cancelled',
}[status] || 'pending');

// ── Inline Review Modal ───────────────────────────────────────────────────
function ReviewModal({ order, token, onClose, onDone }) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name,    setName]    = useState('');
  const [message, setMessage] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const submit = async () => {
    if (!rating)         { setErr('Please select a star rating.'); return; }
    if (!name.trim())    { setErr('Please enter your name.'); return; }
    if (!message.trim()) { setErr('Please write a message.'); return; }
    setSaving(true); setErr('');
    try {
      await axios.post('/api/reviews',
        { order_id: order._id, rating, name: name.trim(), message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDone();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not submit. Please try again.');
    } finally { setSaving(false); }
  };

  const inp = {
    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
    color: '#fff', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', border: '1px solid #2a2a4a', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.05rem' }}>Leave a Review</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: '#111', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.82rem', color: '#888' }}>
          Reviewing: <span style={{ color: '#2ecc71', fontWeight: 600 }}>{order.product_name}</span>
          <span style={{ color: '#555', marginLeft: 8 }}>({order.order_ref})</span>
        </div>

        {/* Stars */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>Your Rating *</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                style={{ fontSize: '2rem', cursor: 'pointer', color: n <= (hovered || rating) ? '#f39c12' : '#333', transition: 'transform 0.1s', transform: n <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)' }}>★</span>
            ))}
            {rating > 0 && (
              <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: 4 }}>
                {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Your Name *</label>
          <input style={inp} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Your Review *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4} style={{ ...inp, resize: 'vertical' }} />
        </div>

        {err && (
          <div style={{ background: '#2a0d0d', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>{err}</div>
        )}

        <p style={{ color: '#555', fontSize: '0.76rem', marginBottom: 14 }}>
          Reviews are checked before publishing. Your name will be shown once approved.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, border: '1px solid #2a2a4a', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            flex: 2, padding: 10, background: saving ? '#1a5c35' : '#2ecc71',
            border: 'none', color: '#000', fontWeight: 700, borderRadius: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────
function OrderCard({ order, token, reviewedIds, onReviewDone }) {
  const [showReview,   setShowReview]   = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const current     = stepIndex(order.status);
  const isDelivered = order.status === 'Delivered';
  const alreadyReviewed = reviewedIds.has(String(order._id)) || reviewSubmitted;

  const date = order.created_at
    ? new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <>
      {showReview && (
        <ReviewModal
          order={order}
          token={token}
          onClose={() => setShowReview(false)}
          onDone={() => { setReviewSubmitted(true); if (onReviewDone) onReviewDone(); }}
        />
      )}

      <div className="order-card">
        <div className="order-header">
          <div>
            <div className="order-ref">{order.order_ref}</div>
            <div className="order-date">Placed on {date}</div>
          </div>
          <span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span>
        </div>

        <div className="order-body">
          <div className="order-field"><label>Product</label><span>{order.product_name}</span></div>
          <div className="order-field"><label>Quantity</label><span>{order.quantity} unit(s)</span></div>
          <div className="order-field"><label>Name</label><span>{order.customer_name}</span></div>
          <div className="order-field"><label>Phone</label><span>{order.phone}</span></div>
          <div className="order-field"><label>Delivery Address</label><span>{order.address}, {order.postcode}</span></div>
          <div className="order-field">
            <label>Total to Pay (COD)</label>
            <span className="price-val">£{Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="order-field"><label>Payment</label><span>{order.payment_method}</span></div>
        </div>

        {order.status !== 'Cancelled' && (
          <div className="order-progress">
            <p className="progress-label">Order Progress</p>
            <div className="progress-steps">
              {STEPS.map((step, i) => (
                <div key={step} className={`progress-step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
                  <div className="step-dot">{i < current ? '✓' : i + 1}</div>
                  <span className="step-label">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review button — only on delivered orders for logged-in customers */}
        {isDelivered && token && (
          <div style={{ padding: '12px 0 4px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
            {alreadyReviewed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2ecc71', fontSize: '0.85rem' }}>
                <span>★</span>
                <span>Review submitted — thank you!</span>
              </div>
            ) : (
              <button
                onClick={() => setShowReview(true)}
                style={{
                  background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
                  color: '#2ecc71', padding: '9px 20px', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.87rem',
                }}
              >
                ★ Leave a Review
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { customer, getToken } = useCustomer();
  const token = getToken();

  const [myOrders,      setMyOrders]      = useState([]);
  const [myLoading,     setMyLoading]     = useState(false);
  const [reviewedIds,   setReviewedIds]   = useState(new Set());

  const [ref,           setRef]           = useState('');
  const [searched,      setSearched]      = useState(false);
  const [searchOrders,  setSearchOrders]  = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error,         setError]         = useState('');

  const loadOrders = () => {
    if (!customer) return;
    setMyLoading(true);
    Promise.all([
      axios.get('/api/customers/my-orders',  { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/reviews/mine',         { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, reviewedRes]) => {
        setMyOrders(ordersRes.data || []);
        setReviewedIds(new Set((reviewedRes.data || []).map(String)));
      })
      .catch(() => {})
      .finally(() => setMyLoading(false));
  };

  useEffect(() => { loadOrders(); }, [customer]);

  const searchByRef = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setSearchLoading(true); setError('');
    try {
      const r = await axios.get('/api/orders', { params: { ref: ref.trim().toUpperCase() } });
      setSearchOrders(r.data); setSearched(true);
    } catch { setError('Could not connect. Please try again.'); }
    finally { setSearchLoading(false); }
  };

  // ── Logged-in view ────────────────────────────────────────────────────────
  if (customer) {
    return (
      <div className="orders-page">
        <div className="page-heading">
          <h1>My Orders</h1>
          <p>Hello <strong style={{ color: '#2ecc71' }}>{customer.full_name}</strong> — here are all your orders.</p>
        </div>

        <div className="search-card" style={{ marginBottom: 28 }}>
          <h2>Track by Order Reference</h2>
          <form onSubmit={searchByRef}>
            <div className="search-row">
              <input type="text" value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="e.g. ORD-A1B2C3D4" maxLength={20} />
              <button type="submit" disabled={searchLoading}>{searchLoading ? 'Searching...' : 'Track'}</button>
            </div>
          </form>
          {searched && searchOrders.length === 0 && <p style={{ color: '#e74c3c', marginTop: 10, fontSize: '0.9rem' }}>No order found with that reference.</p>}
          {searchOrders.map(o => <OrderCard key={o._id} order={o} token={token} reviewedIds={reviewedIds} onReviewDone={loadOrders} />)}
        </div>

        {myLoading && <p style={{ color: '#888', textAlign: 'center', padding: 30 }}>Loading your orders...</p>}

        {!myLoading && myOrders.length === 0 && (
          <div className="info-box">
            <h3>No Orders Yet</h3>
            <p>You have not placed any orders yet. Browse our collection!</p>
            <Link to="/products" className="btn-primary">Shop Now</Link>
          </div>
        )}

        {myOrders.map(order => (
          <OrderCard key={order._id} order={order} token={token} reviewedIds={reviewedIds} onReviewDone={loadOrders} />
        ))}
      </div>
    );
  }

  // ── Guest view ────────────────────────────────────────────────────────────
  return (
    <div className="orders-page">
      <div className="page-heading">
        <h1>My Orders</h1>
        <p>Track your order or <Link to="/login" style={{ color: '#2ecc71' }}>sign in</Link> to see all your orders.</p>
      </div>

      {error && <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 10, padding: '12px 18px', color: '#c0392b', marginBottom: 20, fontSize: '0.84rem' }}>{error}</div>}

      <div className="search-card">
        <h2>Track Your Order</h2>
        <p>Enter the order reference from your confirmation page (e.g. ORD-A1B2C3D4)</p>
        <form onSubmit={searchByRef}>
          <div className="search-row">
            <input type="text" value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="Enter order reference e.g. ORD-A1B2C3D4" maxLength={20} />
            <button type="submit" disabled={searchLoading}>{searchLoading ? 'Searching...' : 'Track Order'}</button>
          </div>
        </form>
      </div>

      {!searched && (
        <div className="info-box">
          <h3>Have an account?</h3>
          <p>Sign in to automatically see all your orders in one place.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      )}

      {searched && searchOrders.length === 0 && (
        <div className="info-box">
          <h3>Order Not Found</h3>
          <p>We could not find an order with that reference. Please check and try again.</p>
        </div>
      )}

      {searchOrders.map(order => <OrderCard key={order._id} order={order} token={null} reviewedIds={new Set()} />)}
    </div>
  );
}