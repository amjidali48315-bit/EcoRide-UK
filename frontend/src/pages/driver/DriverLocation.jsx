import { useState, useEffect, useRef } from 'react';
import { useDriver } from '../../context/DriverContext';
import axios from 'axios';

const fmtDate = d => d
  ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';

export default function DriverLocation() {
  const { driver, getToken, refresh } = useDriver();

  const [postcode,  setPostcode]  = useState('');
  const [request,   setRequest]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');
  const prevStatus = useRef(null);

  const cfg = { headers: { Authorization: `Bearer ${getToken?.()}` } };

  const loadRequest = async () => {
    try {
      const r = await axios.get('/api/drivers/my-location-request', cfg);
      const req = r.data;
      setRequest(req);

      // Detect transition to Approved → refresh driver profile so postcode updates instantly
      if (req && req.status === 'Approved' && prevStatus.current === 'Pending') {
        await refresh();
        setMsg('Your location has been approved and updated!');
        setTimeout(() => setMsg(''), 5000);
      }

      // Also refresh immediately if page loads and latest request is already Approved
      // but driver postcode doesn't match yet (edge case on page reload)
      if (req && req.status === 'Approved' && driver && driver.postcode !== req.requested_postcode) {
        await refresh();
      }

      prevStatus.current = req?.status || null;
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadRequest();
  }, []);

  // Poll every 8 seconds while a request is pending
  useEffect(() => {
    if (request?.status !== 'Pending') return;
    const iv = setInterval(loadRequest, 8000);
    return () => clearInterval(iv);
  }, [request?.status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!postcode.trim()) return;
    setSaving(true); setMsg(''); setErr('');
    try {
      const r = await axios.post('/api/drivers/location-request', { postcode: postcode.trim() }, cfg);
      setRequest(r.data);
      prevStatus.current = 'Pending';
      setPostcode('');
      setMsg('Request submitted! Waiting for admin approval.');
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to submit request.');
    } finally { setSaving(false); }
  };

  const hasPending = request?.status === 'Pending';
  const isApproved = request?.status === 'Approved';
  const isRejected = request?.status === 'Rejected';

  const inp = {
    width: '100%', padding: '12px 14px', background: '#111',
    border: '1px solid #3a3a5a', borderRadius: 10, color: '#fff',
    boxSizing: 'border-box', fontSize: '1rem', letterSpacing: '2px',
    textTransform: 'uppercase', outline: 'none',
  };

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 24 }}>
        <span className="page-title">My Location</span>
        {/* Live polling indicator when pending */}
        {hasPending && (
          <span style={{ color: '#f39c12', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f39c12', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            Checking for approval…
          </span>
        )}
      </div>

      {/* ── Current approved postcode ── */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ color: '#aaa', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Current Approved Location
        </div>
        <div style={{ color: '#2ecc71', fontSize: '2.2rem', fontWeight: 900, letterSpacing: '3px', fontFamily: 'Rajdhani, sans-serif' }}>
          {driver?.postcode || 'Not Set'}
        </div>
        {hasPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ color: '#888', fontSize: '0.8rem' }}>Pending change to:</span>
            <span style={{ color: '#f39c12', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '2px' }}>
              {request.requested_postcode}
            </span>
          </div>
        )}
        {!driver?.postcode && !hasPending && (
          <p style={{ color: '#e74c3c', fontSize: '0.82rem', marginTop: 8, margin: '8px 0 0' }}>
            No postcode set yet. Submit a request below — admin will approve it.
          </p>
        )}
      </div>

      {/* ── Request status banner ── */}
      {!loading && request && (
        <div style={{
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          background: hasPending ? '#1a1a00' : isApproved ? '#0d2e1a' : '#2e0d0d',
          border: `1px solid ${hasPending ? '#f39c1244' : isApproved ? '#2ecc7144' : '#e74c3c44'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {hasPending ? '⏳' : isApproved ? '✅' : '❌'}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: hasPending ? '#f39c12' : isApproved ? '#2ecc71' : '#e74c3c' }}>
                  {hasPending ? 'Awaiting Admin Approval' : isApproved ? 'Location Request Approved' : 'Location Request Rejected'}
                </span>
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Requested: <strong style={{ color: '#fff', letterSpacing: '1px' }}>{request.requested_postcode}</strong></span>
                {request.current_postcode && (
                  <span>From: <strong style={{ color: '#555' }}>{request.current_postcode}</strong></span>
                )}
                <span>Submitted: {fmtDate(request.created_at)}</span>
              </div>
              {isRejected && request.rejection_reason && (
                <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 8 }}>
                  Reason: {request.rejection_reason}
                </div>
              )}
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
              background: hasPending ? '#2a2200' : isApproved ? '#0d3a1a' : '#3a0d0d',
              color: hasPending ? '#f39c12' : isApproved ? '#2ecc71' : '#e74c3c',
              border: `1px solid ${hasPending ? '#f39c1244' : isApproved ? '#2ecc7144' : '#e74c3c44'}`,
            }}>
              {request.status}
            </span>
          </div>
        </div>
      )}

      {/* ── Why postcode matters ── */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '16px 20px', marginBottom: 16 }}>
        <h4 style={{ color: '#fff', margin: '0 0 10px', fontSize: '0.88rem' }}>Why Your Location Matters</h4>
        {[
          'Admin uses your postcode to calculate your distance from each customer order.',
          'Your delivery pay (£/mile) is based on this distance.',
          'Update your postcode each day before starting deliveries.',
          'Changes must be approved by admin before taking effect.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ color: '#777', fontSize: '0.82rem', lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>

      {/* ── Submit request form ── */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '20px 24px' }}>
        <h3 style={{ color: '#fff', margin: '0 0 6px', fontSize: '1rem' }}>
          {hasPending ? 'Update Pending Request' : 'Request Location Change'}
        </h3>
        {hasPending && (
          <p style={{ color: '#f39c12', fontSize: '0.8rem', margin: '0 0 16px' }}>
            You already have a pending request. Submitting a new one will replace it.
          </p>
        )}
        {!hasPending && (
          <p style={{ color: '#666', fontSize: '0.8rem', margin: '0 0 16px' }}>
            Enter your new postcode below. Admin will approve or reject your request.
          </p>
        )}

        {msg && (
          <div style={{ background: '#0d2e1a', border: '1px solid #2ecc71', borderRadius: 8, padding: '10px 14px', color: '#2ecc71', marginBottom: 14, fontSize: '0.85rem' }}>
            ✓ {msg}
          </div>
        )}
        {err && (
          <div style={{ background: '#3a0d0d', border: '1px solid #e74c3c', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', marginBottom: 14, fontSize: '0.85rem' }}>
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
              New Postcode *
            </label>
            <input style={inp} type="text" value={postcode}
              onChange={e => setPostcode(e.target.value.toUpperCase())}
              placeholder="e.g. M1 1AE" maxLength={8} />
            <p style={{ color: '#555', fontSize: '0.75rem', marginTop: 6 }}>
              Enter the postcode nearest to your current location.
            </p>
          </div>
          <button type="submit" disabled={saving || !postcode.trim()} style={{
            padding: '13px 28px', width: '100%',
            background: saving ? '#1a5c35' : postcode.trim() ? '#2ecc71' : '#1a2e1a',
            border: 'none', color: postcode.trim() && !saving ? '#000' : '#555',
            fontWeight: 700, borderRadius: 10,
            cursor: saving || !postcode.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem', transition: 'all 0.15s',
          }}>
            {saving ? 'Submitting…' : hasPending ? 'Replace Pending Request' : 'Submit Location Request'}
          </button>
        </form>
      </div>
    </>
  );
}