import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

const ALL_CATS = [
  { value: 'all',         label: 'All Products' },
  { value: 'E-Scooter',  label: 'E-Scooters'   },
  { value: 'E-Bike',     label: 'E-Bikes'       },
  { value: 'Deals',      label: 'Deals'         },
  { value: 'Child Gifts',label: 'Child Gifts'   },
  { value: 'Offers',     label: 'Offers'        },
];

const HERO = {
  'all':         { title: 'All Products',    sub: 'Browse our full collection of electric rides.' },
  'E-Scooter':   { title: 'E-Scooters',     sub: 'Top-rated electric scooters for every rider.' },
  'E-Bike':      { title: 'E-Bikes',        sub: 'Powerful electric bikes for any journey.' },
  'Deals':       { title: 'Deals',          sub: 'Best value products — handpicked for you.' },
  'Child Gifts': { title: 'Child Gifts',    sub: 'Perfect electric rides for kids.' },
  'Offers':      { title: 'Special Offers', sub: 'Limited time offers — don\'t miss out.' },
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [reviewMap, setReviewMap] = useState({});

  useEffect(() => {
    axios.get('/api/reviews/summary').then(r => setReviewMap(r.data)).catch(() => {});
  }, []);

  const category = searchParams.get('category') || 'all';
  const hero = HERO[category] || HERO['all'];

  useEffect(() => {
    setLoading(true);
    axios.get('/api/products', { params: category !== 'all' ? { category } : {} })
      .then(r => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const navigate = useNavigate();

  const setCategory = (cat) => {
    if (cat === 'Offers') {
      navigate('/?goto=offers');
      return;
    }
    if (cat === 'all') setSearchParams({});
    else setSearchParams({ category: cat });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const badgeClass = (badge) => (badge || '').toLowerCase().replace(/\s/g, '');

  return (
    <>
      {/* Hero */}
      <div className="shop-hero">
        <h1>{hero.title.includes('E-Scooter') || hero.title.includes('E-Bike')
          ? <>{hero.title.split(' ').map((w, i) => i === 0 ? <span key={i}>{w} </span> : w)}</>
          : <span>{hero.title}</span>
        }</h1>
        <p>{hero.sub}</p>
        <p style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.7 }}>
          Free UK delivery · Cash on Delivery · 12 Month Warranty
        </p>
      </div>

      <div className="shop-container">
        {/* Category filter tabs */}
        <div className="shop-filter-bar">
          <p className="count">
            Showing <strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''}
          </p>
          <div className="filter-buttons" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
            {ALL_CATS.map(cat => (
              <button
                key={cat.value}
                className={`filter-btn ${category === cat.value ? 'active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="shop-grid">
          {loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              Loading products…
            </div>
          )}
          {!loading && products.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
              <p>No products in this category yet.</p>
              <button
                onClick={() => setCategory('all')}
                style={{ marginTop: 14, background: '#2ecc71', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                View All Products
              </button>
            </div>
          )}
          {products.map(p => (
            <div key={p._id} className="shop-card">
              <div className="card-img">
                {p.badge && <span className={`badge ${badgeClass(p.badge)}`}>{p.badge}</span>}
                <img src={p.image || '/images/placeholder.jpg'} alt={p.name} onError={e => { e.target.src = '/images/placeholder.jpg'; }} />
              </div>
              <div className="card-body">
                <p className="cat-tag">{p.category}</p>
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
                <p className="desc">{p.description}</p>
                <div className="card-footer">
                  <span className="price">£{Number(p.price).toLocaleString()}</span>
                  <Link to={`/products/${p._id}`} className="view-btn">View Product</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}