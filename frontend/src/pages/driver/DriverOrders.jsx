import { useState, useEffect, useRef } from 'react';
import { useDriver } from '../../context/DriverContext';

const fmtMoney = n => `£${Number(n || 0).toFixed(2)}`;
const fmtDate  = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_COLOR = {
  Pending: '#f39c12', Accepted: '#9b59b6', Assigned: '#3498db',
  Dispatched: '#1abc9c', Delivered: '#2ecc71', Cancelled: '#e74c3c',
};

// ── Turn instruction from OSRM step ──────────────────────────────────────
function formatStep(step) {
  const { type, modifier } = step.maneuver;
  const road    = step.name || 'road';
  const distM   = step.distance;
  const distStr = distM >= 1609 ? `${(distM / 1609.34).toFixed(1)} mi` : `${Math.round(distM)} m`;
  let action;
  if      (type === 'depart')    action = `Head ${modifier ? modifier + ' ' : ''}on ${road}`;
  else if (type === 'arrive')    action = `Arrive at destination`;
  else if (type === 'turn')      action = `Turn ${modifier} onto ${road}`;
  else if (type === 'new name' || type === 'continue') action = `Continue onto ${road}`;
  else if (type === 'merge')     action = `Merge onto ${road}`;
  else if (type === 'on ramp')   action = `Take the ramp onto ${road}`;
  else if (type === 'off ramp')  action = `Take the exit onto ${road}`;
  else if (type === 'fork')      action = `Keep ${modifier} at fork toward ${road}`;
  else if (type === 'end of road') action = `Turn ${modifier} at end of ${road}`;
  else if (type === 'roundabout' || type === 'rotary') action = `At the roundabout, take exit onto ${road}`;
  else action = `${type}${modifier ? ' ' + modifier : ''} onto ${road}`;
  return { action, dist: distStr };
}

// ── Map component ─────────────────────────────────────────────────────────
function OrderMap({ order, driverPostcode }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const [steps,      setSteps]      = useState([]);
  const [routeInfo,  setRouteInfo]  = useState(null);
  const [stepsReady, setStepsReady] = useState(false);

  const custPostcode = order.postcode;
  const dist         = order.live_distance || 0;

  useEffect(() => {
    let cancelled = false, intervalId = null, rafId = null;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    function buildMap(L, dLat, dLng, cLat, cLng) {
      if (cancelled || !mapRef.current) return;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
      const map = L.map(mapRef.current, { scrollWheelZoom: false });
      mapInst.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(map);
      setTimeout(() => { if (!cancelled && mapInst.current) mapInst.current.invalidateSize(); }, 150);
      const dIcon = L.divIcon({ html: `<div style="background:#3498db;border-radius:50%;width:14px;height:14px;border:3px solid #fff;box-shadow:0 0 8px rgba(52,152,219,0.9)"></div>`, className: '', iconSize: [14,14], iconAnchor: [7,7] });
      const cIcon = L.divIcon({ html: `<div style="background:#e74c3c;border-radius:50%;width:16px;height:16px;border:3px solid #fff;box-shadow:0 0 8px rgba(231,76,60,0.9)"></div>`, className: '', iconSize: [16,16], iconAnchor: [8,8] });
      L.marker([dLat, dLng], { icon: dIcon }).addTo(map).bindPopup('Your Location');
      L.marker([cLat, cLng], { icon: cIcon }).addTo(map).bindPopup(`${order.address}, ${order.postcode}`);
      map.fitBounds([[dLat, dLng], [cLat, cLng]], { padding: [50, 50] });
      fetch(`https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${cLng},${cLat}?steps=true&geometries=geojson&overview=full`)
        .then(r => r.json()).then(data => {
          if (cancelled || !data.routes?.[0]) return;
          const route = data.routes[0];
          const rl = L.geoJSON(route.geometry, { style: { color: '#2ecc71', weight: 5, opacity: 0.85 } }).addTo(map);
          map.fitBounds(rl.getBounds(), { padding: [50, 50] });
          setTimeout(() => { if (!cancelled && mapInst.current) mapInst.current.invalidateSize(); }, 100);
          if (!cancelled) { setRouteInfo({ duration: Math.round(route.duration/60), distance: (route.distance/1609.34).toFixed(1) }); setSteps(route.legs?.[0]?.steps || []); setStepsReady(true); }
        }).catch(() => { if (!cancelled) setStepsReady(true); });
    }
    async function init() {
      if (cancelled) return;
      let dLat, dLng, cLat, cLng;
      if (driverPostcode && custPostcode) {
        try {
          const r = await fetch('https://api.postcodes.io/postcodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postcodes: [driverPostcode, custPostcode] }) });
          const data = await r.json();
          const dr = data.result?.[0]?.result, cr = data.result?.[1]?.result;
          if (dr && cr) { dLat = dr.latitude; dLng = dr.longitude; cLat = cr.latitude; cLng = cr.longitude; }
        } catch {}
      }
      if (!dLat && order.driver_lat)   { dLat = order.driver_lat;   dLng = order.driver_lng; }
      if (!cLat && order.customer_lat) { cLat = order.customer_lat; cLng = order.customer_lng; }
      if (!dLat || !cLat || cancelled) { setStepsReady(true); return; }
      function go() {
        if (cancelled) return;
        if (window.L) buildMap(window.L, dLat, dLng, cLat, cLng);
        else if (!document.getElementById('leaflet-js')) {
          const s = document.createElement('script'); s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = () => { if (!cancelled) buildMap(window.L, dLat, dLng, cLat, cLng); }; document.body.appendChild(s);
        } else { intervalId = setInterval(() => { if (window.L) { clearInterval(intervalId); intervalId = null; if (!cancelled) buildMap(window.L, dLat, dLng, cLat, cLng); } }, 100); }
      }
      rafId = requestAnimationFrame(go);
    }
    init();
    return () => { cancelled = true; if (rafId) cancelAnimationFrame(rafId); if (intervalId) clearInterval(intervalId); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [driverPostcode, custPostcode, order._id]);

  const openInMaps = driverPostcode
    ? `https://www.google.com/maps/dir/${encodeURIComponent(driverPostcode + ', UK')}/${encodeURIComponent(order.address + ', ' + order.postcode + ', UK')}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ', ' + order.postcode)}`;

  return (
    <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
      <div style={{ background: '#111', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ color: '#ccc', fontSize: '0.83rem' }}>
          <span style={{ color: '#888' }}>To: </span><strong>{order.address}, {order.postcode}</strong>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {routeInfo && <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.85rem' }}>~{routeInfo.duration} min</span>}
          <span style={{ color: '#f39c12', fontWeight: 700, fontSize: '0.85rem' }}>{dist > 0 ? `${dist} mi` : 'Local'}</span>
          <a href={openInMaps} target="_blank" rel="noreferrer" style={{ background: '#2ecc71', color: '#000', padding: '5px 12px', borderRadius: 7, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>Open Maps</a>
        </div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 260 }} />
      <div style={{ background: '#0d0d1a', padding: '12px 14px', maxHeight: 220, overflowY: 'auto' }}>
        <div style={{ color: '#666', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Directions</span>
          {routeInfo && <span style={{ fontWeight: 400 }}>{routeInfo.distance} mi · ~{routeInfo.duration} min</span>}
        </div>
        {!stepsReady && <div style={{ color: '#555', fontSize: '0.8rem' }}>Loading directions…</div>}
        {stepsReady && steps.length === 0 && <div style={{ color: '#555', fontSize: '0.8rem' }}>Use "Open Maps" for navigation.</div>}
        {steps.map((step, i) => {
          const { action, dist: sd } = formatStep(step);
          const isLast = i === steps.length - 1;
          const mod = step.maneuver.modifier;
          const icon = isLast ? '✓' : step.maneuver.type === 'depart' ? '▶' : mod === 'left' ? '←' : mod === 'right' ? '→' : mod === 'slight left' ? '↖' : mod === 'slight right' ? '↗' : step.maneuver.type === 'roundabout' ? '⟳' : '↑';
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderBottom: i < steps.length - 1 ? '1px solid #111' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isLast ? '#0d2e1a' : '#1a1a3e', border: `1px solid ${isLast ? '#2ecc71' : '#2a2a5a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isLast ? '0.65rem' : '0.75rem', color: isLast ? '#2ecc71' : '#5dade2' }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: isLast ? '#2ecc71' : '#ccc', fontSize: '0.8rem', lineHeight: 1.4 }}>{action}</div>
                {!isLast && step.distance > 50 && <div style={{ color: '#555', fontSize: '0.72rem' }}>{sd}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cancel modal ──────────────────────────────────────────────────────────
function CancelModal({ order, onClose, onConfirm }) {
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const submit = async () => {
    if (!reason.trim()) { setErr('Please enter a reason for cancellation.'); return; }
    setLoading(true); setErr('');
    try { await onConfirm(reason); onClose(); }
    catch (e) { setErr(e.response?.data?.error || 'Failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', border: '1px solid #e74c3c44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e74c3c18', border: '1px solid #e74c3c44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c', fontSize: '1rem' }}>✕</div>
          <div>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Cancel Order</h3>
            <div style={{ color: '#2ecc71', fontSize: '0.78rem', fontFamily: 'monospace' }}>{order.order_ref}</div>
          </div>
        </div>

        <div style={{ background: '#111', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem' }}>
          <div style={{ color: '#888', marginBottom: 2 }}>Customer: <span style={{ color: '#fff' }}>{order.customer_name}</span></div>
          <div style={{ color: '#888' }}>Amount: <span style={{ color: '#e74c3c', fontWeight: 700 }}>{fmtMoney(order.total_amount)}</span> <span style={{ color: '#555' }}>(will NOT be charged)</span></div>
        </div>

        <div style={{ background: '#2e1a0d', border: '1px solid #e67e2233', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#e67e22', fontSize: '0.82rem' }}>
          ⚠ Cancelling this order means no cash was collected and no payment will be owed to admin.
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
            Reason for Cancellation *
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setErr(''); }}
            placeholder="e.g. Customer not available, wrong address, customer refused delivery..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${err ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: '#fff', boxSizing: 'border-box', fontSize: '0.88rem', resize: 'vertical', outline: 'none' }}
          />
          {err && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid #2a2a4a', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Go Back
          </button>
          <button onClick={submit} disabled={loading} style={{
            flex: 1, padding: '11px', background: loading ? '#3a1010' : '#e74c3c',
            border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Cancelling…' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Earnings summary ──────────────────────────────────────────────────────
function EarningsSummary({ order }) {
  const distMiles  = order.distance_miles || 0;
  const isFlat     = distMiles <= 4;
  const amountOwed = Number(order.total_amount) - Number(order.driver_payment);
  return (
    <div style={{ background: '#0d1a0d', border: '1px solid #1a5c35', borderRadius: 12, padding: '16px 18px', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#000', fontWeight: 700 }}>✓</div>
        <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.95rem' }}>Delivery Complete — Your Earnings</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'Distance', value: distMiles === 0 ? 'Local' : `${distMiles} mi`, color: '#f39c12' },
          { label: 'Your Earnings', value: fmtMoney(order.driver_payment), color: '#2ecc71', badge: isFlat ? 'flat rate' : null },
          { label: 'Cash Collected', value: fmtMoney(order.total_amount), color: '#fff' },
          { label: 'Pay to Admin', value: fmtMoney(amountOwed), color: '#e74c3c' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0a1a0a', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: '#555', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>
              {s.value}
              {s.badge && <span style={{ color: '#888', fontSize: '0.65rem', marginLeft: 5, background: '#1a2a1a', padding: '1px 5px', borderRadius: 8 }}>{s.badge}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#0d2e1a', borderRadius: 8, padding: '8px 12px', color: '#888', fontSize: '0.78rem', lineHeight: 1.5 }}>
        Keep <strong style={{ color: '#2ecc71' }}>{fmtMoney(order.driver_payment)}</strong> and pay <strong style={{ color: '#e74c3c' }}>{fmtMoney(amountOwed)}</strong> back to admin. Upload proof in Payments.
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [mapOpen,     setMapOpen]     = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [updating,    setUpdating]    = useState(false);
  const [toast,       setToast]       = useState('');
  const { updateOrderStatus, driver } = useDriver();

  const hasMap   = !!order.postcode;
  const color    = STATUS_COLOR[order.status] || '#888';
  const isActive = !['Delivered', 'Cancelled'].includes(order.status);
  const rate     = driver?.payment_per_mile || 1.5;
  const dist     = order.live_distance || 0;
  const estimatedPay = order.driver_payment
    ? fmtMoney(order.driver_payment)
    : dist === 0 || dist <= 4 ? '£15.00' : fmtMoney(rate * dist);

  const doStatus = async (status) => {
    setUpdating(true);
    try { await updateOrderStatus(order._id, status); setToast(status === 'Dispatched' ? 'Marked as dispatched!' : 'Marked as delivered!'); setTimeout(() => setToast(''), 3000); }
    catch { setToast('Failed. Try again.'); setTimeout(() => setToast(''), 3000); }
    finally { setUpdating(false); }
  };

  const doCancel = async (reason) => {
    setUpdating(true);
    try { await updateOrderStatus(order._id, 'Cancelled', reason); }
    finally { setUpdating(false); }
  };

  return (
    <>
      {cancelModal && <CancelModal order={order} onClose={() => setCancelModal(false)} onConfirm={doCancel} />}

      <div style={{
        background: '#1a1a2e', borderRadius: 14,
        border: `1px solid ${isActive ? '#2a2a4a' : order.status === 'Delivered' ? '#1a5c35' : '#3a1a1a'}`,
        marginBottom: 14, overflow: 'hidden', boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Colour strip */}
        <div style={{ height: 3, background: color }} />

        <div style={{ padding: '16px 18px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ color: '#2ecc71', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.92rem' }}>{order.order_ref}</div>
              <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{fmtDate(order.created_at)}</div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700, background: color + '20', color, border: `1px solid ${color}44` }}>
              {order.status}
            </span>
          </div>

          {/* Customer info */}
          <div style={{ background: '#111', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.83rem' }}>
              <div><span style={{ color: '#555' }}>Customer</span><div style={{ color: '#fff', fontWeight: 600, marginTop: 1 }}>{order.customer_name}</div></div>
              <div><span style={{ color: '#555' }}>Phone</span><div style={{ marginTop: 1 }}><a href={`tel:${order.phone}`} style={{ color: '#5dade2', textDecoration: 'none', fontWeight: 600 }}>{order.phone}</a></div></div>
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#555' }}>Address</span><div style={{ color: '#ccc', marginTop: 1 }}>{order.address}, <strong style={{ color: '#f39c12' }}>{order.postcode}</strong></div></div>
              <div><span style={{ color: '#555' }}>Product</span><div style={{ color: '#ccc', marginTop: 1 }}>{order.product_name} ×{order.quantity}</div></div>
            </div>
          </div>

          {/* Money row */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 9, overflow: 'hidden', border: '1px solid #2a2a4a', marginBottom: 14 }}>
            <div style={{ flex: 1, padding: '9px 12px', background: '#111', borderRight: '1px solid #2a2a4a' }}>
              <div style={{ color: '#555', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collect</div>
              <div style={{ color: '#2ecc71', fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>{fmtMoney(order.total_amount)}</div>
            </div>
            {dist != null && (
              <div style={{ flex: 1, padding: '9px 12px', background: '#111', borderRight: '1px solid #2a2a4a' }}>
                <div style={{ color: '#555', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
                <div style={{ color: '#f39c12', fontWeight: 700, fontSize: '1.05rem', marginTop: 2 }}>{dist > 0 ? `${dist} mi` : 'Local'}</div>
              </div>
            )}
            <div style={{ flex: 1, padding: '9px 12px', background: '#111' }}>
              <div style={{ color: '#555', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Pay</div>
              <div style={{ color: '#9b59b6', fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>{estimatedPay}</div>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div style={{ background: toast.includes('Failed') ? '#2e0d0d' : '#0d2e1a', border: `1px solid ${toast.includes('Failed') ? '#e74c3c' : '#2ecc71'}`, borderRadius: 8, padding: '8px 14px', marginBottom: 10, color: toast.includes('Failed') ? '#e74c3c' : '#2ecc71', fontSize: '0.82rem', fontWeight: 600 }}>
              {toast}
            </div>
          )}

          {/* Action buttons */}
          {isActive && !updating && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasMap && (
                <button onClick={() => setMapOpen(!mapOpen)} style={{
                  flex: 1, minWidth: 100, padding: '10px 0',
                  background: mapOpen ? '#0f3460' : '#111',
                  border: `1px solid ${mapOpen ? '#5dade2' : '#3a3a5a'}`,
                  color: mapOpen ? '#5dade2' : '#888',
                  borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                }}>
                  {mapOpen ? '✕ Hide Map' : '🗺 Route'}
                </button>
              )}
              {order.status !== 'Dispatched' && (
                <button onClick={() => doStatus('Dispatched')} style={{
                  flex: 1, minWidth: 100, padding: '10px 0',
                  background: '#0d1e3a', border: '1px solid #3498db',
                  color: '#3498db', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                }}>Dispatched</button>
              )}
              <button onClick={() => doStatus('Delivered')} style={{
                flex: 2, minWidth: 120, padding: '10px 0',
                background: '#0d2e1a', border: '2px solid #2ecc71',
                color: '#2ecc71', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
              }}>Mark Delivered</button>
              <button onClick={() => setCancelModal(true)} style={{
                flex: 1, minWidth: 80, padding: '10px 0',
                background: '#2e0d0d', border: '1px solid #e74c3c55',
                color: '#e74c3c', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              }}>Cancel</button>
            </div>
          )}
          {updating && <div style={{ textAlign: 'center', color: '#555', padding: '8px', fontSize: '0.85rem' }}>Updating…</div>}

          {/* Map */}
          {mapOpen && hasMap && isActive && <OrderMap order={order} driverPostcode={driver?.postcode} />}

          {/* Earnings (delivered) */}
          {order.status === 'Delivered' && <EarningsSummary order={order} />}

          {/* Cancelled notice */}
          {order.status === 'Cancelled' && (
            <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c33', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
              <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>Order Cancelled</div>
              {order.admin_notes && (
                <div style={{ color: '#888', fontSize: '0.78rem' }}>{order.admin_notes}</div>
              )}
              <div style={{ color: '#555', fontSize: '0.75rem', marginTop: 4 }}>No payment required — nothing was collected.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function DriverOrders() {
  const { orders, activeOrders, deliveredOrders, refresh } = useDriver();
  const [filter, setFilter] = useState('active');

  const filtered = filter === 'active'    ? activeOrders
                 : filter === 'delivered' ? deliveredOrders
                 : orders;

  const tabs = [
    { id: 'active',    label: 'Active',    count: activeOrders.length },
    { id: 'delivered', label: 'Delivered', count: deliveredOrders.length },
    { id: 'all',       label: 'All',       count: orders.length },
  ];

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 18 }}>
        <span className="page-title">My Orders</span>
        <button onClick={refresh} style={{ background: 'none', border: '1px solid #3a3a5a', color: '#888', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem',
            background: filter === t.id ? '#2ecc71' : '#111',
            color:      filter === t.id ? '#000'    : '#666',
          }}>
            {t.label}
            <span style={{ marginLeft: 5, opacity: 0.7, fontSize: '0.75rem' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: '#555', margin: 0 }}>No {filter === 'active' ? 'active' : filter === 'delivered' ? 'delivered' : ''} orders.</p>
        </div>
      )}

      {filtered.map(order => <OrderCard key={order._id} order={order} />)}
    </>
  );
}