import { useState, useRef } from 'react';
import { useDriver } from '../../context/DriverContext';
import axios from 'axios';

const fmtMoney = n => `£${Number(n || 0).toFixed(2)}`;
const fmtDate  = d => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const imgSrc = i => (!i ? null : i.startsWith('http') ? i : i);

export default function DriverPayments() {
  const { payments, pendingPayments, totalOwed, totalPaid, refresh, getToken } = useDriver();

  const [amount,   setAmount]   = useState('');
  const [notes,    setNotes]    = useState('');
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [success,  setSuccess]  = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [proofModal, setProofModal]   = useState(null);
  const fileRef = useRef();

  const entered     = parseFloat(amount) || 0;
  const isOverpay   = entered > totalOwed + 0.01;
  const isValid     = entered > 0 && !isOverpay && !!file;
  const newBalance  = Math.max(0, totalOwed - entered);

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    setErr('');
  };

  const fill = (fraction) => {
    setAmount((totalOwed * fraction).toFixed(2));
    setErr('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      if (!entered)     { setErr('Please enter an amount.'); return; }
      if (isOverpay)    { setErr(`Cannot exceed total owed of ${fmtMoney(totalOwed)}.`); return; }
      if (!file)        { setErr('Please upload payment proof.'); return; }
    }
    setSaving(true); setErr('');
    try {
      const data = new FormData();
      data.append('amount_paid',  entered.toFixed(2));
      data.append('proof_image',  file);
      data.append('notes',        notes);
      await axios.post('/api/drivers/payments/bulk-pay', data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuccess(`Payment of ${fmtMoney(entered)} submitted successfully!`);
      setAmount(''); setNotes(''); setFile(null); setPreview('');
      if (fileRef.current) fileRef.current.value = '';
      refresh();
      setTimeout(() => setSuccess(''), 5000);
    } catch (e) {
      setErr(e.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setSaving(false); }
  };

  const paidRecords = payments.filter(p => p.payment_status === 'Paid');
  const allPaid     = totalOwed <= 0.01;

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Payments</span>
      </div>

      {/* ── Total Outstanding ── */}
      <div style={{
        background: allPaid
          ? 'linear-gradient(135deg, #0d2e1a, #1a3a2a)'
          : 'linear-gradient(135deg, #2e0d0d, #1a1a2e)',
        border: `1px solid ${allPaid ? '#2ecc7144' : '#e74c3c44'}`,
        borderRadius: 16, padding: '24px 22px', marginBottom: 20,
        textAlign: 'center',
      }}>
        {allPaid ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>✅</div>
            <div style={{ color: '#2ecc71', fontSize: '1.4rem', fontWeight: 800 }}>All Settled!</div>
            <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>You have no outstanding balance.</div>
          </>
        ) : (
          <>
            <div style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Total Amount Payable to Admin
            </div>
            <div style={{ color: '#e74c3c', fontSize: '3rem', fontWeight: 900, lineHeight: 1, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '-1px' }}>
              {fmtMoney(totalOwed)}
            </div>
            <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 8 }}>
              Across {pendingPayments.length} order{pendingPayments.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total Collected', value: fmtMoney(payments.reduce((s, p) => s + (p.cash_collected || 0), 0)), color: '#3498db' },
          { label: 'Your Earnings',   value: fmtMoney(payments.reduce((s, p) => s + (p.driver_earning || 0), 0)), color: '#2ecc71' },
          { label: 'Amount Paid',     value: fmtMoney(totalPaid), color: '#9b59b6' },
          { label: 'Still Owed',      value: fmtMoney(totalOwed), color: '#e74c3c' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '1.2rem' }}>{s.value}</div>
            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Payment form ── */}
      {!allPaid && (
        <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', padding: '22px 20px', marginBottom: 20 }}>
          <h3 style={{ color: '#fff', margin: '0 0 18px', fontSize: '1rem' }}>Submit Payment</h3>

          <form onSubmit={submit}>
            {/* Amount input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                Amount to Pay *
              </label>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#2ecc71', fontWeight: 800, fontSize: '1.1rem' }}>£</span>
                <input
                  type="number" min="0.01" max={totalOwed} step="0.01"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErr(''); }}
                  placeholder={totalOwed.toFixed(2)}
                  style={{
                    width: '100%', padding: '14px 14px 14px 34px',
                    background: '#111',
                    border: `1.5px solid ${isOverpay ? '#e74c3c' : amount && entered > 0 ? '#2ecc71' : '#3a3a5a'}`,
                    borderRadius: 10, color: '#fff', boxSizing: 'border-box',
                    fontSize: '1.4rem', fontWeight: 700, outline: 'none',
                  }}
                />
              </div>

              {/* Quick fill buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['Full', 1]].map(([label, frac]) => (
                  <button key={label} type="button" onClick={() => fill(frac)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    background: amount && Math.abs(entered - totalOwed * frac) < 0.01 ? '#2ecc71' : '#111',
                    border: '1px solid #2a2a4a',
                    color:  amount && Math.abs(entered - totalOwed * frac) < 0.01 ? '#000' : '#888',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>

              {/* Live preview */}
              {entered > 0 && !isOverpay && (
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', background: '#0d1a0d', border: '1px solid #1a4a2a', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ color: '#888', fontSize: '0.82rem' }}>Balance after payment</span>
                  <strong style={{ color: newBalance <= 0.01 ? '#2ecc71' : '#f39c12', fontSize: '0.9rem' }}>
                    {newBalance <= 0.01 ? '£0.00 — Fully settled ✓' : fmtMoney(newBalance)}
                  </strong>
                </div>
              )}
              {isOverpay && (
                <div style={{ marginTop: 8, color: '#e74c3c', fontSize: '0.8rem' }}>
                  Cannot exceed total owed of {fmtMoney(totalOwed)}.
                </div>
              )}
            </div>

            {/* File upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                Upload Payment Proof *
              </label>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {/* Preview thumbnail */}
                <div style={{
                  width: 70, height: 70, borderRadius: 10, flexShrink: 0,
                  background: '#111', border: `1.5px dashed ${file ? '#2ecc71' : '#3a3a5a'}`,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {preview
                    ? <img src={preview} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#555', fontSize: '1.5rem' }}>📎</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" id="proof-file"
                    onChange={handleFile} style={{ display: 'none' }} />
                  <label htmlFor="proof-file" style={{
                    display: 'block', padding: '11px 16px', textAlign: 'center',
                    background: file ? '#0d2e1a' : '#0f3460',
                    border: `1px solid ${file ? '#2ecc71' : '#1a4a80'}`,
                    color: file ? '#2ecc71' : '#5dade2',
                    borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    {file ? `✓ ${file.name.slice(0, 24)}` : 'Choose Screenshot / Receipt'}
                  </label>
                  <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 5 }}>
                    Bank transfer screenshot, cash receipt, or any payment confirmation
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                Notes (optional)
              </label>
              <input
                type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Bank transfer ref 123456"
                style={{ width: '100%', padding: '11px 14px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            {/* Error / Success */}
            {err && (
              <div style={{ background: '#2e0d0d', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                {err}
              </div>
            )}
            {success && (
              <div style={{ background: '#0d2e1a', border: '1px solid #2ecc71', color: '#2ecc71', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ {success}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={saving || !isValid} style={{
              width: '100%', padding: '15px',
              background: saving ? '#1a5c35' : isValid ? '#2ecc71' : '#1a2e1a',
              border: 'none', color: isValid && !saving ? '#000' : '#555',
              fontWeight: 800, borderRadius: 10, cursor: isValid && !saving ? 'pointer' : 'not-allowed',
              fontSize: '1rem', transition: 'all 0.15s',
            }}>
              {saving ? 'Submitting…' : entered > 0 ? `Submit ${fmtMoney(entered)} Payment` : 'Enter Amount to Submit'}
            </button>
          </form>
        </div>
      )}

      {/* ── Payment history ── */}
      {payments.length > 0 && (
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', overflow: 'hidden' }}>
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Payment History <span style={{ color: '#555', fontWeight: 400 }}>({payments.length} orders)</span>
            </span>
            <span style={{ color: '#555', transition: 'transform 0.2s', display: 'inline-block', transform: showHistory ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
          </button>

          {showHistory && payments.map(p => {
            const isPending = p.payment_status !== 'Paid';
            const remaining = Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0));
            const color     = p.payment_status === 'Paid' ? '#2ecc71' : p.payment_status === 'Partial' ? '#f39c12' : '#e74c3c';
            const proof     = imgSrc(p.proof_image);
            return (
              <div key={p._id} style={{ padding: '13px 18px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 2 }}>{p.order_ref}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#666', marginBottom: 3 }}>
                    <span>Collected: <span style={{ color: '#3498db' }}>{fmtMoney(p.cash_collected)}</span></span>
                    <span>Your cut: <span style={{ color: '#9b59b6' }}>{fmtMoney(p.driver_earning)}</span></span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888' }}>
                    {isPending
                      ? <span>Owed: <strong style={{ color: '#e74c3c' }}>{fmtMoney(remaining)}</strong></span>
                      : <span style={{ color: '#555' }}>Paid {fmtDate(p.paid_at)}</span>
                    }
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {proof && (
                    <button onClick={() => setProofModal(proof)} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#5dade2', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                      View Proof
                    </button>
                  )}
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: color + '18', color, border: `1px solid ${color}33` }}>
                    {p.payment_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof modal */}
      {proofModal && (
        <div onClick={() => setProofModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '0.82rem' }}>Payment Proof</span>
              <button onClick={() => setProofModal(null)} style={{ background: '#2a2a4a', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>✕ Close</button>
            </div>
            <img src={proofModal} alt="Proof" style={{ width: '100%', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', borderRadius: 10, background: '#111' }} />
          </div>
        </div>
      )}
    </>
  );
}