import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCustomer } from '../context/CustomerContext';

export default function CartCheckoutPage() {
  const { cart, cartTotal, customer, clearCart } = useCustomer();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    phone: '', address: '', postcode: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null); // array of order_refs

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      // Place one order per cart item
      const placed = [];
      for (const item of cart) {
        const r = await axios.post('/api/orders', {
          ...form,
          product_id: item.product_id,
          quantity: item.quantity,
          customer_id: customer?.id || null,
        });
        placed.push(r.data.order_ref);
      }
      await clearCart();
      setResults(placed);
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.error || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (results) {
    return (
      <div className="checkout-wrap">
        <div className="thankyou-box">
          <div className="thankyou-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={36} height={36}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Orders Confirmed!</h2>
          <p style={{ color: '#aaa', marginBottom: 8 }}>Your order references:</p>
          {results.map(ref => (
            <p key={ref} className="ref" style={{ marginBottom: 4 }}>
              <strong style={{ color: '#2ecc71' }}>{ref}</strong>
            </p>
          ))}
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: 16, marginBottom: 20 }}>
            We will call you within 24 hours to confirm delivery. Pay cash on arrival.
          </p>
          <div className="btn-group">
            <Link to="/my-orders" className="btn-primary">Track Orders</Link>
            <Link to="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrap">
      <div className="form-card">
        <h2>Checkout</h2>
        <p className="subtitle" style={{ marginBottom: 16 }}>
          {cart.length} item{cart.length > 1 ? 's' : ''} · Total: <strong style={{ color: '#2ecc71' }}>£{cartTotal.toLocaleString()}</strong>
        </p>

        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#111', borderRadius: 10, border: '1px solid #2a2a4a' }}>
          {cart.map(i => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#ccc', fontSize: '0.9rem' }}>
              <span>{i.product_name} × {i.quantity}</span>
              <span>£{(i.price * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="error-list" style={{ marginBottom: 16 }}>
            {errors.map((e, i) => <p key={i}>• {e}</p>)}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-field">
              <label>Full Name</label>
              <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="John Smith" required />
            </div>
            <div className="form-field">
              <label>UK Phone</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="07700 000000" required />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Delivery Address</label>
            <input type="text" value={form.address} onChange={set('address')} placeholder="123 High Street" required />
          </div>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Postcode</label>
            <input type="text" value={form.postcode} onChange={set('postcode')} placeholder="SW1A 1AA" required />
          </div>
          <div className="order-total">
            <span className="total-label">Total to pay on delivery</span>
            <span className="total-amount">£{cartTotal.toLocaleString()}</span>
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Placing Orders…' : 'Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
