import { useState, useEffect, useRef } from 'react';
import axios from '../../axiosConfig';

const fmtMoney = n => `£${Number(n || 0).toFixed(2)}`;
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const imgSrc   = i => (!i ? null : i.startsWith('http') ? i : i);

// ── Confirm Payment Modal ─────────────────────────────────────────────────
function ConfirmModal({ driver, totalOwed, onClose, onDone }) {
  const [amount,  setAmount]  = useState(totalOwed.toFixed(2));
  const [notes,   setNotes]   = useState('');
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const fileRef = useRef();

  const entered    = parseFloat(amount) || 0;
  const isOverpay  = entered > totalOwed + 0.01;
  const isValid    = entered > 0 && !isOverpay;
  const newBalance = Math.max(0, totalOwed - entered);

  const submit = async () => {
    if (!isValid) { setErr(isOverpay ? `Cannot exceed ${fmtMoney(totalOwed)}.` : 'Enter a valid amount.'); return; }
    setSaving(true); setErr('');
    try {
      const data = new FormData();
      data.append('amount_confirmed', entered.toFixed(2));
      data.append('notes', notes);
      if (file) data.append('proof_image', file);
      await axios.post(`/api/drivers/admin/bulk-confirm/${driver._id}`, data, { withCredentials: true });
      onDone();
      onClose();
    } catch (e) { setErr(e.response?.data?.error || 'Failed. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #2a2a4a', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.05rem' }}>Confirm Payment Received</h3>
            <div style={{ color: '#9b59b6', fontSize: '0.8rem', marginTop: 3 }}>from {driver.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Total owed highlight */}
        <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c33', borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Total Owed by Driver</div>
          <div style={{ color: '#e74c3c', fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Rajdhani, sans-serif' }}>{fmtMoney(totalOwed)}</div>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Amount Received *</label>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#2ecc71', fontWeight: 800, fontSize: '1.1rem' }}>£</span>
            <input type="number" min="0.01" max={totalOwed} step="0.01" value={amount}
              onChange={e => { setAmount(e.target.value); setErr(''); }}
              style={{
                width: '100%', padding: '13px 14px 13px 34px',
                background: '#111',
                border: `1.5px solid ${isOverpay ? '#e74c3c' : entered > 0 ? '#2ecc71' : '#3a3a5a'}`,
                borderRadius: 10, color: '#fff', boxSizing: 'border-box',
                fontSize: '1.3rem', fontWeight: 700, outline: 'none',
              }} />
          </div>

          {/* Quick fill */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['Full', 1]].map(([label, frac]) => (
              <button key={label} type="button"
                onClick={() => { setAmount((totalOwed * frac).toFixed(2)); setErr(''); }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid #2a2a4a',
                  background: Math.abs(entered - totalOwed * frac) < 0.01 ? '#2ecc71' : '#111',
                  color:      Math.abs(entered - totalOwed * frac) < 0.01 ? '#000' : '#888',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                }}>{label}</button>
            ))}
          </div>

          {entered > 0 && !isOverpay && (
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d1a0d', border: '1px solid #1a4a2a', borderRadius: 8, padding: '9px 14px' }}>
              <span style={{ color: '#888', fontSize: '0.82rem' }}>Remaining after confirm</span>
              <strong style={{ color: newBalance <= 0.01 ? '#2ecc71' : '#f39c12', fontSize: '0.88rem' }}>
                {newBalance <= 0.01 ? 'Fully settled ✓' : fmtMoney(newBalance)}
              </strong>
            </div>
          )}
          {isOverpay && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 6 }}>Cannot exceed {fmtMoney(totalOwed)}.</div>}
        </div>

        {/* Proof upload (optional for admin) */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Upload Admin Proof (optional)</label>
          <input ref={fileRef} type="file" accept="image/*,.pdf" id="admin-proof"
            onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          <label htmlFor="admin-proof" style={{
            display: 'block', padding: '10px 16px', textAlign: 'center',
            background: file ? '#0d2e1a' : '#111', border: `1px solid ${file ? '#2ecc71' : '#3a3a5a'}`,
            color: file ? '#2ecc71' : '#888', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          }}>
            {file ? `✓ ${file.name.slice(0, 28)}` : '📎 Choose File (optional)'}
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Cash received at office"
            style={{ width: '100%', padding: '11px 14px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' }} />
        </div>

        {err && <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c', color: '#e74c3c', padding: '9px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving || !isValid} style={{
            flex: 2, padding: '11px',
            background: isValid && !saving ? '#2ecc71' : '#1a3a1a',
            border: 'none', color: isValid && !saving ? '#000' : '#555',
            fontWeight: 700, borderRadius: 8, cursor: isValid && !saving ? 'pointer' : 'not-allowed', fontSize: '0.95rem',
          }}>
            {saving ? 'Confirming…' : `Confirm ${entered > 0 ? fmtMoney(entered) : ''} Received`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Driver payment card ───────────────────────────────────────────────────
function DriverCard({ driverInfo, payments, onConfirm, onViewProof }) {
  const [expanded, setExpanded] = useState(false);

  const pendingPays = payments.filter(p => p.payment_status !== 'Paid');
  const paidPays    = payments.filter(p => p.payment_status === 'Paid');
  const totalOwed   = pendingPays.reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
  const totalPaid   = paidPays.reduce((s, p) => s + (p.amount_owed || 0), 0);
  const allSettled  = totalOwed <= 0.01;

  // Latest proof from any pending record
  const latestProof = pendingPays.map(p => imgSrc(p.proof_image)).filter(Boolean).pop();

  return (
    <div style={{ background: '#13131f', border: `1px solid ${allSettled ? '#2a2a4a' : '#e74c3c22'}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>

      {/* Driver header */}
      <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: allSettled ? '#0d2e1a' : '#2e0d0d',
            border: `2px solid ${allSettled ? '#2ecc71' : '#e74c3c'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: allSettled ? '#2ecc71' : '#e74c3c', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
          }}>
            {(driverInfo?.name || 'D')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{driverInfo?.name || 'Unknown Driver'}</div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginTop: 2 }}>{driverInfo?.email} · {driverInfo?.city}</div>
          </div>
        </div>

        {/* Amount + action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            {!allSettled && (
              <div>
                <div style={{ color: '#e74c3c', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
                  {fmtMoney(totalOwed)}
                </div>
                <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 2 }}>outstanding</div>
              </div>
            )}
            {allSettled && (
              <div style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.88rem' }}>✓ All Settled</div>
            )}
            {totalPaid > 0 && (
              <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{fmtMoney(totalPaid)} received</div>
            )}
          </div>

          {latestProof && (
            <div onClick={() => onViewProof(latestProof)} style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', border: '2px solid #2ecc71', cursor: 'pointer', background: '#111', flexShrink: 0 }}>
              <img src={latestProof} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}

          {!allSettled && (
            <button onClick={() => onConfirm(driverInfo, totalOwed)} style={{
              padding: '10px 18px', background: '#2ecc71', border: 'none',
              color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', whiteSpace: 'nowrap',
            }}>
              Confirm Received
            </button>
          )}
        </div>
      </div>

      {/* Order breakdown toggle */}
      {payments.length > 0 && (
        <div>
          <button onClick={() => setExpanded(e => !e)} style={{
            width: '100%', padding: '10px 20px', background: '#111', border: 'none', borderTop: '1px solid #1a1a2e',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#555', fontSize: '0.78rem' }}>{payments.length} order{payments.length !== 1 ? 's' : ''} — click to {expanded ? 'hide' : 'show'} breakdown</span>
            <span style={{ color: '#555', fontSize: '0.75rem', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {expanded && payments.map(p => {
            const remaining = Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0));
            const color = p.payment_status === 'Paid' ? '#2ecc71' : p.payment_status === 'Partial' ? '#f39c12' : '#e74c3c';
            const proof = imgSrc(p.proof_image);
            return (
              <div key={p._id} style={{ padding: '11px 20px', borderTop: '1px solid #0d0d1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: 3 }}>{p.order_ref}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#666' }}>
                    <span>Collected: <span style={{ color: '#3498db' }}>{fmtMoney(p.cash_collected)}</span></span>
                    <span>Driver cut: <span style={{ color: '#9b59b6' }}>{fmtMoney(p.driver_earning)}</span></span>
                    <span>{p.payment_status !== 'Paid' ? 'Owed: ' : 'Settled: '}
                      <span style={{ color }}>{p.payment_status !== 'Paid' ? fmtMoney(remaining) : fmtMoney(p.amount_owed)}</span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {proof && (
                    <button onClick={() => onViewProof(proof)} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#5dade2', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem' }}>
                      Proof
                    </button>
                  )}
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: color + '18', color, border: `1px solid ${color}33` }}>
                    {p.payment_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminPayments() {
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('All');
  const [proofModal, setProofModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { driver, totalOwed }
  const [msg,        setMsg]        = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/drivers/admin/payments', { withCredentials: true })
      .then(r => setPayments(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  // Group by driver
  const grouped = {};
  payments.forEach(p => {
    const id = p.driver_id?._id || String(p.driver_id);
    if (!grouped[id]) grouped[id] = { driver: p.driver_id, payments: [] };
    grouped[id].payments.push(p);
  });

  const driverGroups = Object.values(grouped).sort((a, b) => {
    const aOwed = a.payments.filter(p => p.payment_status !== 'Paid').reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
    const bOwed = b.payments.filter(p => p.payment_status !== 'Paid').reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
    return bOwed - aOwed;
  });

  const filteredGroups = driverGroups.filter(({ payments: pays }) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return pays.some(p => p.payment_status !== 'Paid');
    if (filter === 'Settled')  return pays.every(p => p.payment_status === 'Paid');
    return true;
  });

  const totalOwedAll    = payments.filter(p => p.payment_status !== 'Paid').reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
  const totalReceivedAll = payments.filter(p => p.payment_status === 'Paid').reduce((s, p) => s + (p.amount_owed || 0), 0);
  const totalCashAll    = payments.reduce((s, p) => s + (p.cash_collected || 0), 0);
  const driversWithDues = driverGroups.filter(g => g.payments.some(p => p.payment_status !== 'Paid')).length;

  return (
    <>
      {/* Proof modal */}
      {proofModal && (
        <div onClick={() => setProofModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#aaa', fontSize: '0.82rem' }}>Payment Proof</span>
              <button onClick={() => setProofModal(null)} style={{ background: '#2a2a4a', border: 'none', color: '#fff', padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>✕ Close</button>
            </div>
            <img src={proofModal} alt="Proof" style={{ width: '100%', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', borderRadius: 12, background: '#111' }} onError={e => { e.target.alt = 'Failed to load'; }} />
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          driver={confirmModal.driver}
          totalOwed={confirmModal.totalOwed}
          onClose={() => setConfirmModal(null)}
          onDone={() => { load(); flash(`Payment confirmed for ${confirmModal.driver.name}.`); }}
        />
      )}

      {/* Topbar */}
      <div className="admin-topbar" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-title">Driver Payments</span>
          {msg && <span style={{ color: '#2ecc71', fontSize: '0.88rem' }}>✓ {msg}</span>}
        </div>
        <button onClick={load} style={{ background: 'none', border: '1px solid #3a3a5a', color: '#888', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem' }}>Refresh</button>
      </div>

      {/* Total outstanding card */}
      <div style={{
        background: totalOwedAll > 0
          ? 'linear-gradient(135deg, #2e0d0d, #1a1a2e)'
          : 'linear-gradient(135deg, #0d2e1a, #1a2e1a)',
        border: `1px solid ${totalOwedAll > 0 ? '#e74c3c33' : '#2ecc7133'}`,
        borderRadius: 16, padding: '22px 24px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Total Outstanding from All Drivers
          </div>
          <div style={{ color: totalOwedAll > 0 ? '#e74c3c' : '#2ecc71', fontSize: '2.8rem', fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
            {fmtMoney(totalOwedAll)}
          </div>
          {driversWithDues > 0 && (
            <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 6 }}>
              {driversWithDues} driver{driversWithDues !== 1 ? 's' : ''} with outstanding balance
            </div>
          )}
          {totalOwedAll <= 0 && <div style={{ color: '#2ecc71', fontSize: '0.85rem', marginTop: 4 }}>All drivers are fully settled ✓</div>}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total Cash Out', value: fmtMoney(totalCashAll), color: '#3498db' },
            { label: 'Total Received', value: fmtMoney(totalReceivedAll), color: '#2ecc71' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'right' }}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: '1.2rem' }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a4a', maxWidth: 320 }}>
        {['All', 'Pending', 'Settled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
            background: filter === f ? '#2ecc71' : '#111',
            color:      filter === f ? '#000' : '#666',
          }}>{f}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}

      {/* No drivers */}
      {!loading && filteredGroups.length === 0 && (
        <p style={{ color: '#555', padding: 20, textAlign: 'center', fontSize: '0.88rem' }}>No payment records found.</p>
      )}

      {/* Driver cards */}
      {!loading && filteredGroups.map(({ driver, payments: dPayments }) => (
        <DriverCard
          key={driver?._id || 'unknown'}
          driverInfo={driver}
          payments={dPayments}
          onConfirm={(drv, owed) => setConfirmModal({ driver: drv, totalOwed: owed })}
          onViewProof={setProofModal}
        />
      ))}
    </>
  );
}