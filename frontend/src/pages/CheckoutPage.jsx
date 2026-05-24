import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCustomer } from '../context/CustomerContext';

export default function CheckoutPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer } = useCustomer();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]     = useState([]);
  const [success, setSuccess]   = useState(null);

  const initQty = Math.max(1, parseInt(searchParams.get('qty')) || 1);
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    phone: '', address: '', postcode: '', quantity: initQty,
  });

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Pre-fill name if customer logs in
  useEffect(() => {
    if (customer?.full_name && !form.full_name) {
      setForm(f => ({ ...f, full_name: customer.full_name }));
    }
  }, [customer]);

  const set = (field) => (e) => {
    const val = field === 'quantity' ? Math.max(1, parseInt(e.target.value) || 1) : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const changeQty = (delta) => {
    const totalStock = (product.stock_london || 0) + (product.stock_birmingham || 0);
    setForm(f => ({
      ...f,
      quantity: Math.max(1, Math.min(totalStock, f.quantity + delta)),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const r = await axios.post('/api/orders', {
        ...form,
        product_id: id,
        quantity: form.quantity,
        customer_id: customer?.id || null,
      });
      setSuccess(r.data);
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.error || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>;
  if (!product) return null;

  const totalStock = (product.stock_london || 0) + (product.stock_birmingham || 0);
  const total = product.price * form.quantity;

  if (success) {
    const o = success.order;
    return (
      <div className="checkout-wrap">
        <div className="thankyou-box">
          <div className="thankyou-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={36} height={36}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Order Confirmed!</h2>
          <p className="ref">Your order reference: <strong>{success.order_ref}</strong></p>
          <div className="order-summary-box">
            <p><strong>Product:</strong> {o.product_name}</p>
            <p><strong>Quantity:</strong> {o.quantity}</p>
            <p><strong>Total:</strong> £{Number(o.total_amount).toLocaleString()}</p>
            <p><strong>Payment:</strong> Cash on Delivery</p>
            <p><strong>Postcode:</strong> {o.postcode}</p>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: 12 }}>What happens next:</p>
          <ul className="steps-list">
            {[
              'We will call you within 24 hours to confirm delivery time.',
              'Your order will be dispatched within 1-2 business days.',
              'Delivery takes 1-3 business days across the UK.',
              'Pay the driver in cash when your order arrives.',
            ].map((s, i) => (
              <li key={i}><span className="step-num">{i + 1}</span> {s}</li>
            ))}
          </ul>
          <div className="btn-group">
            <Link to="/my-orders" className="btn-primary">Track My Order</Link>
            <Link to="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrap">
      <div className="order-product-banner">
        <span className="prod-name">{product.name}</span>
        <span className="prod-price">£{Number(product.price).toLocaleString()}</span>
      </div>

      <div className="form-card">
        <h2>Place Your Order</h2>
        <p className="subtitle">Fill in your details and we will deliver to your door — pay cash on arrival.</p>

        {errors.length > 0 && (
          <div className="error-list">
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
              <label>UK Phone Number</label>
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="07700 000000" required />
            </div>
          </div>
          <div className="form-row full">
            <div className="form-field">
              <label>Delivery Address</label>
              <input type="text" value={form.address} onChange={set('address')} placeholder="123 High Street" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Postcode</label>
              <input type="text" value={form.postcode} onChange={set('postcode')} placeholder="SW1A 1AA" required />
            </div>
            <div className="form-field">
              <label>Number of Scooters</label>
              <div className="qty-control">
                <button type="button" className="qty-btn" onClick={() => changeQty(-1)}>-</button>
                <input
                  type="number"
                  className="qty-value"
                  value={form.quantity}
                  min={1}
                  max={totalStock}
                  onChange={set('quantity')}
                  style={{ width: 60, border: 'none', borderLeft: '1.5px solid #e0e0e0', borderRight: '1.5px solid #e0e0e0' }}
                />
                <button type="button" className="qty-btn" onClick={() => changeQty(1)}>+</button>
              </div>
            </div>
          </div>
          <div className="order-total">
            <span className="total-label">Total to pay on delivery</span>
            <span className="total-amount">£{total.toLocaleString()}</span>
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Placing Order…' : 'Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
