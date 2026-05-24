import { useState, useEffect } from 'react';

const COOKIE_KEY = 'escooter_cookie_consent';

// ─── Tracking helpers ────────────────────────────────────────────────────────

// Replace these with your real IDs when you have them:
const GA_ID      = 'G-XXXXXXXXXX';   // ← your Google Analytics ID
const PIXEL_ID   = 'XXXXXXXXXXXXXXX'; // ← your Facebook Pixel ID

function loadGoogleAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;

  const s1 = document.createElement('script');
  s1.async = true;
  s1.src   = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

function loadFacebookPixel() {
  if (window._fbLoaded) return;
  window._fbLoaded = true;

  /* eslint-disable */
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

function loadTracking() {
  loadGoogleAnalytics();
  loadFacebookPixel();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CookieBanner() {
  const [visible, setVisible]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) {
      // small delay so banner doesn't flash on first paint
      setTimeout(() => setVisible(true), 800);
    } else if (saved === 'accepted') {
      loadTracking();
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    loadTracking();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur only on mobile when detail is open */}
      {showDetail && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 9998, display: 'none',
          }}
        />
      )}

      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     9999,
        background: 'linear-gradient(135deg, #12122a 0%, #1a1a3a 100%)',
        borderTop:  '1px solid #2ecc7133',
        boxShadow:  '0 -4px 30px rgba(0,0,0,0.5)',
        padding:    '14px 20px',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {/* Main bar */}
        <div style={{
          maxWidth:    900,
          margin:      '0 auto',
          display:     'flex',
          alignItems:  'center',
          gap:         16,
          flexWrap:    'wrap',
        }}>
          {/* Icon */}
          {/* Text */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <span style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: 1.5 }}>
              We use cookies to keep you logged in, remember your cart, and — if you agree —
              track visits so we can improve our site and show you relevant ads.{' '}
            </span>
            <button
              onClick={() => setShowDetail(v => !v)}
              style={{
                background: 'none', border: 'none', color: '#2ecc71',
                fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0,
              }}
            >
              {showDetail ? 'Hide details' : 'Learn more'}
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={decline}
              style={{
                padding:      '9px 18px',
                border:       '1px solid #3a3a5a',
                background:   'transparent',
                color:        '#888',
                borderRadius: 8,
                cursor:       'pointer',
                fontSize:     '0.84rem',
                fontWeight:   600,
                whiteSpace:   'nowrap',
              }}
            >
              Decline
            </button>
            <button
              onClick={accept}
              style={{
                padding:      '9px 22px',
                border:       'none',
                background:   'linear-gradient(135deg, #2ecc71, #27ae60)',
                color:        '#000',
                borderRadius: 8,
                cursor:       'pointer',
                fontSize:     '0.84rem',
                fontWeight:   700,
                whiteSpace:   'nowrap',
                boxShadow:    '0 2px 12px #2ecc7144',
              }}
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Detail panel */}
        {showDetail && (
          <div style={{
            maxWidth:    900,
            margin:      '14px auto 0',
            background:  '#0d0d1a',
            border:      '1px solid #2a2a4a',
            borderRadius: 10,
            padding:     '14px 16px',
            display:     'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:         12,
          }}>
            {[
              {
                icon:  '',
                title: 'Essential Cookies',
                desc:  'Keep you logged in, remember your cart. Always active — the site cannot work without these.',
                color: '#2ecc71',
                always: true,
              },
              {
                icon:  '',
                title: 'Analytics (Google)',
                desc:  'Shows us which pages are popular, where visitors come from, and how to improve the site.',
                color: '#3498db',
                always: false,
              },
              {
                icon:  '',
                title: 'Marketing (Facebook)',
                desc:  'Lets us show you our products again on Facebook & Instagram after you visit. Helps us reach the right buyers.',
                color: '#9b59b6',
                always: false,
              },
            ].map(c => (
              <div key={c.title} style={{
                background:   '#111',
                borderRadius: 8,
                padding:      '12px 14px',
                border:       `1px solid ${c.color}22`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: c.color, fontWeight: 700, fontSize: '0.86rem' }}>
                    {c.title}
                  </span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, background: c.always ? '#2ecc7122' : '#ffffff11',
                    color: c.always ? '#2ecc71' : '#888', border: `1px solid ${c.always ? '#2ecc7133' : '#2a2a4a'}`,
                  }}>
                    {c.always ? 'Always on' : 'Optional'}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}