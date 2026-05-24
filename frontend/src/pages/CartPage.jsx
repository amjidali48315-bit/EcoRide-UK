import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';

const imgSrc = (image) => {
  if (!image) return null;
  return image;
};

export default function CartPage() {
  const { cart, cartTotal, removeFromCart, addToCart, customer } = useCustomer();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px 40px' }}>
        <div style={{ fontSize: '3rem', color: '#2ecc71', marginBottom: 16, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>Cart</div>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: '#aaa', marginBottom: 24 }}>Add some scooters to get started!</p>
        <Link to="/products" style={{
          background: '#2ecc71', color: '#000', padding: '12px 28px',
          borderRadius: 10, textDecoration: 'none', fontWeight: 700, display: 'inline-block',
        }}>Browse Products</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px 48px' }}>
      <h2 style={{ color: '#fff', marginBottom: 20, fontSize: '1.4rem' }}>Your Cart</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {cart.map((item) => {
          const src = imgSrc(item.image);
          return (
            <div key={item.product_id} style={{
              background: '#1a1a2e',
              borderRadius: 14,
              border: '1px solid #2a2a4a',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {/* Top row: image + name + remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                  background: '#111', border: '1px solid #2a2a4a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {src ? (
                    <img src={src} alt={item.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span style={{ color: '#555', fontSize: '0.7rem' }}>No image</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: 4 }}>
                    {item.product_name}
                  </div>
                  <div style={{ color: '#2ecc71', fontSize: '0.88rem', fontWeight: 600 }}>
                    £{item.price.toLocaleString()} each
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  style={{
                    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                    color: '#e74c3c', cursor: 'pointer', fontSize: '0.78rem',
                    fontWeight: 700, padding: '5px 10px', borderRadius: 7, flexShrink: 0,
                  }}
                >Remove</button>
              </div>

              {/* Bottom row: qty controls + subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#111', borderRadius: 10, border: '1px solid #2a2a4a', overflow: 'hidden' }}>
                  <button
                    onClick={() => addToCart({ _id: item.product_id, name: item.product_name, price: item.price, image: item.image }, Math.max(1, item.quantity - 1))}
                    style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <span style={{ color: '#fff', fontWeight: 700, minWidth: 32, textAlign: 'center', fontSize: '0.95rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addToCart({ _id: item.product_id, name: item.product_name, price: item.price, image: item.image }, item.quantity + 1)}
                    style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: 2 }}>Subtotal</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                    £{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '20px 18px', border: '1px solid #2a2a4a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
            {cart.reduce((s, i) => s + i.quantity, 0)} item(s)
          </span>
          <span style={{ color: '#2ecc71', fontSize: '1.5rem', fontWeight: 800 }}>
            £{cartTotal.toLocaleString()}
          </span>
        </div>
        <p style={{ color: '#555', fontSize: '0.82rem', marginBottom: 20 }}>
          Cash on Delivery — pay when your scooter arrives
        </p>

        {customer ? (
          <button onClick={() => navigate('/checkout-cart')} style={{
            width: '100%', padding: '15px 0', background: '#2ecc71', border: 'none',
            color: '#000', fontWeight: 800, fontSize: '1rem', borderRadius: 12, cursor: 'pointer',
          }}>Proceed to Checkout</button>
        ) : (
          <>
            <p style={{ color: '#aaa', fontSize: '0.86rem', marginBottom: 12 }}>
              Sign in to checkout, or{' '}
              <Link to="/checkout-cart" style={{ color: '#2ecc71' }}>continue as guest</Link>
            </p>
            <Link to="/login" style={{
              display: 'block', textAlign: 'center', padding: '15px 0',
              background: '#2ecc71', color: '#000', fontWeight: 800,
              fontSize: '1rem', borderRadius: 12, textDecoration: 'none',
            }}>Sign In to Checkout</Link>
          </>
        )}
      </div>
    </div>
  );
}