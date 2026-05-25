import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../axiosConfig';
import { useCustomer } from '../context/CustomerContext';

const imgSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return image; // relative path — proxied correctly on both desktop and mobile
};

function QuantityPicker({ price, maxStock, qty, setQty }) {
  return (
    <div className="qty-wrapper">
      <span className="qty-label">Quantity</span>
      <div className="qty-row">
        <div className="qty-control">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>-</button>
          <span className="qty-value">{qty}</span>
          <button className="qty-btn" onClick={() => setQty(q => Math.min(maxStock, q + 1))} disabled={qty >= maxStock}>+</button>
        </div>
        {qty > 1 && <span className="qty-total">Total: £{(price * qty).toLocaleString('en-GB')}</span>}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCustomer();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [cartMsg, setCartMsg] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
    axios.get(`/api/reviews/product/${id}`)
      .then(r => setReviews(r.data))
      .catch(() => {});
  }, [id, navigate]);

  const handleAddToCart = async () => {
    await addToCart(product, qty);
    setCartMsg('Added to cart!');
    setTimeout(() => setCartMsg(''), 2500);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>;
  if (!product) return null;

  const totalStock = product.stock_by_city
    ? Object.values(product.stock_by_city).reduce((s, v) => s + (Number(v) || 0), 0)
    : (product.stock || 0);
  const specs = product.specs ? Object.entries(product.specs) : [];
  const image = imgSrc(product.image);

  return (
    <>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>

      {/* Image */}
      <div style={{
        width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 32,
        background: '#1a1a2e', border: '1px solid #2a2a4a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320,
      }}>
        {image && !imgError ? (
          <img src={image} alt={product.name} onError={() => setImgError(true)}
            style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#555' }}>
            <span style={{ fontSize: '1rem' }}>No image available</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 28, border: '1px solid #2a2a4a' }}>
        <p style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          {product.category}
        </p>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, marginBottom: 10 }}>{product.name}</h1>
        <p style={{ color: '#2ecc71', fontSize: '2rem', fontWeight: 700, marginBottom: 16 }}>
          £{Number(product.price).toLocaleString()}
        </p>

        {product.description && (
          <p style={{ color: '#aaa', lineHeight: 1.7, marginBottom: 20 }}>{product.description}</p>
        )}

        {specs.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr>
                <th colSpan={2} style={{
                  background: '#111', color: '#fff', padding: '10px 14px', textAlign: 'left',
                  fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  borderRadius: '8px 8px 0 0',
                }}>Specifications</th>
              </tr>
            </thead>
            <tbody>
              {specs.map(([k, v], i) => (
                <tr key={k} style={{ background: i % 2 === 0 ? '#111' : '#0d0d1a' }}>
                  <td style={{ padding: '9px 14px', color: '#888', width: '40%', fontSize: '0.9rem' }}>{k}</td>
                  <td style={{ padding: '9px 14px', color: '#fff', fontSize: '0.9rem' }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{
          background: '#0d2e1a', border: '1px solid #1a5c35', borderRadius: 10,
          padding: '10px 14px', color: '#2ecc71', fontSize: '0.88rem', marginBottom: 20,
        }}>
          Cash on Delivery — pay when your order arrives
        </div>

        {totalStock > 0 ? (
          <>
            <QuantityPicker price={product.price} maxStock={totalStock} qty={qty} setQty={setQty} />
            <p style={{ color: '#555', fontSize: '0.82rem', marginBottom: 16 }}>
              {totalStock} in stock — order today for fast delivery
            </p>
            {cartMsg && (
              <div style={{
                background: '#0d2e1a', border: '1px solid #2ecc71', color: '#2ecc71',
                padding: '8px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.88rem',
              }}>
                Added to cart successfully
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleAddToCart} style={{
                flex: 1, padding: '13px 0', background: 'transparent',
                border: '2px solid #2ecc71', color: '#2ecc71',
                borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              }}>Add to Cart</button>
              <Link to={`/checkout/${product._id}?qty=${qty}`} style={{
                flex: 1, padding: '13px 0', background: '#2ecc71', color: '#000',
                borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>Order Now</Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: '#e74c3c', fontSize: '0.9rem', marginBottom: 12 }}>Currently out of stock</p>
            <button disabled style={{
              width: '100%', padding: 13, background: '#222', color: '#555',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'not-allowed',
            }}>Out of Stock</button>
          </>
        )}
      </div>
    </div>

    {/* ── Customer Reviews ───────────────────────────────────────── */}
    <div style={{ maxWidth: 800, margin: '32px auto 0', padding: '0 20px 48px' }}>
      <div style={{ borderTop: '1px solid #2a2a4a', paddingTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            Customer Reviews
          </h2>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ letterSpacing: 2 }}>
                {[1,2,3,4,5].map(n => {
                  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                  return <span key={n} style={{ color: n <= Math.round(avg) ? '#f39c12' : '#333', fontSize: '1.1rem' }}>★</span>;
                })}
              </span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>

        {reviews.length === 0 && (
          <p style={{ color: '#555', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
            No reviews yet — be the first to review this product after your purchase!
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(r => (
            <div key={r._id} style={{
              background: '#1a1a2e', border: '1px solid #2a2a4a',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</span>
                  <div style={{ marginTop: 4, letterSpacing: 1 }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ color: n <= r.rating ? '#f39c12' : '#333', fontSize: '0.88rem' }}>★</span>
                    ))}
                  </div>
                </div>
                <span style={{ color: '#555', fontSize: '0.75rem', flexShrink: 0 }}>
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                "{r.message}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}