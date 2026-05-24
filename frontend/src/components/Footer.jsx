import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.132 1.278.333 2.148.63 2.913.306.789.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.63C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.131 2.148-.334 2.913-.63.789-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.337 1.384-2.126.296-.765.499-1.635.63-2.913.066-1.28.082-1.689.082-4.948 0-3.259-.014-3.667-.072-4.947-.132-1.278-.334-2.148-.63-2.913C23.079 4.906 22.668 4.236 22 3.57c-.666-.667-1.336-1.079-2.126-1.384-.765-.297-1.635-.499-2.913-.63C15.667.012 15.259 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

function buildContactLinks(s) {
  const links = [];
  if (s.site_email)
    links.push({ key: 'email', label: 'Email Us', href: `mailto:${s.site_email}`, Icon: EmailIcon, color: '#5dade2' });
  if (s.social_whatsapp) {
    const num = s.social_whatsapp.replace(/\D/g, '');
    links.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${num}`, Icon: WhatsAppIcon, color: '#25D366' });
  }
  if (s.social_instagram) {
    const handle = s.social_instagram.replace(/^@/, '');
    links.push({ key: 'instagram', label: 'Instagram', href: `https://instagram.com/${handle}`, Icon: InstagramIcon, color: '#E1306C' });
  }
  if (s.social_facebook) {
    const page = s.social_facebook.startsWith('http') ? s.social_facebook : `https://facebook.com/${s.social_facebook}`;
    links.push({ key: 'facebook', label: 'Facebook', href: page, Icon: FacebookIcon, color: '#1877F2' });
  }
  if (s.social_tiktok) {
    const user = s.social_tiktok.replace(/^@/, '');
    links.push({ key: 'tiktok', label: 'TikTok', href: `https://tiktok.com/@${user}`, Icon: TikTokIcon, color: '#fff' });
  }
  return links;
}

export default function Footer() {
  const [settings,      setSettings]      = useState({});
  const [contactLinks,  setContactLinks]  = useState([]);

  useEffect(() => {
    axios.get('/api/settings')
      .then(r => {
        setSettings(r.data);
        setContactLinks(buildContactLinks(r.data));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo">EcoRide <strong>UK</strong></span>
          <p>Premium electric scooters and bikes.<br />Fast free delivery across the UK.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/my-orders">My Orders</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        {/* Contact Us */}
        <div className="footer-contact">
          <h4>Contact Us</h4>

          {/* Phone as plain text */}
          {settings.site_phone && (
            <p style={{ marginBottom: 14 }}>{settings.site_phone}</p>
          )}

          {/* Column of icon buttons */}
          {contactLinks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {contactLinks.map(({ key, label, href, Icon, color }) => (
                <a
                  key={key}
                  href={href}
                  target={key === 'email' ? '_self' : '_blank'}
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'background 0.2s, transform 0.15s',
                    color: color,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <Icon />
                  <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{label}</span>
                </a>
              ))}
            </div>
          )}

          {/* Opening hours below all icons */}
          {settings.site_hours && (
            <p style={{ fontSize: '0.82rem', color: '#555', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 2 }}>
              {settings.site_hours}
            </p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} EcoRide UK. All rights reserved.</p>
      </div>
    </footer>
  );
}