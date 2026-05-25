import { useState, useEffect } from 'react';
import axios from '../axiosConfig';

const STATUSES = ['All', 'Pending', 'Assigned', 'Partner', 'Delivered', 'Cancelled'];

const statusColor = (s) => ({
  Pending: '#f39c12', Assigned: '#3498db', Partner: '#9b59b6',
  Delivered: '#2ecc71', Cancelled: '#e74c3c',
}[s] || '#888');

const POSTCODE_CITY = {
  'E':'London','EC':'London','N':'London','NW':'London','SE':'London','SW':'London','W':'London','WC':'London',
  'BR':'London','CR':'London','DA':'London','EN':'London','HA':'London','IG':'London','KT':'London',
  'RM':'London','SM':'London','TW':'London','UB':'London','WD':'London',
  'B':'Birmingham','CV':'Coventry','WS':'Walsall','WV':'Wolverhampton','DY':'Dudley',
  'M':'Manchester','SK':'Stockport','OL':'Oldham','BL':'Bolton','WN':'Wigan','WA':'Warrington',
  'LS':'Leeds','BD':'Bradford','HX':'Halifax','HD':'Huddersfield','WF':'Wakefield',
  'S':'Sheffield','DN':'Doncaster','L':'Liverpool','CH':'Chester','PR':'Preston',
  'BS':'Bristol','BA':'Bath','NE':'Newcastle','SR':'Sunderland','DH':'Durham',
  'NG':'Nottingham','DE':'Derby','LE':'Leicester','EH':'Edinburgh','G':'Glasgow',
  'CF':'Cardiff','NP':'Newport','SA':'Swansea','BT':'Belfast',
  'SO':'Southampton','PO':'Portsmouth','OX':'Oxford','CB':'Cambridge',
  'BN':'Brighton','TN':'Tunbridge Wells','RG':'Reading','SL':'Slough',
  'LU':'Luton','AL':'St Albans','HP':'Hemel Hempstead','MK':'Milton Keynes',
  'PL':'Plymouth','EX':'Exeter','TQ':'Torquay','ST':'Stoke-on-Trent','TF':'Telford',
  'HU':'Hull','YO':'York','NN':'Northampton','PE':'Peterborough','TS':'Middlesbrough',
  'DL':'Darlington','LA':'Lancaster','FY':'Blackpool','BB':'Blackburn',
  'AB':'Aberdeen','DD':'Dundee','IV':'Inverness','GL':'Gloucester','SN':'Swindon',
  'CT':'Canterbury','ME':'Maidstone','SS':'Southend','CM':'Chelmsford',
  'CO':'Colchester','IP':'Ipswich','NR':'Norwich','WR':'Worcester','SY':'Shrewsbury',
};

function cityFromPostcode(postcode) {
  const area = (postcode || '').trim().toUpperCase().replace(/\s+/g,'').match(/^[A-Z]+/)?.[0] || '';
  return POSTCODE_CITY[area] || area || '';
}

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [cities, setCities]     = useState([]);
  const [msg, setMsg]           = useState('');
  const [selected, setSelected] = useState(null);
  const [modalTab, setModalTab] = useState('driver');
  const [partnerForm, setPartnerForm] = useState({ partner_name: '', partner_whatsapp: '' });
  const [partnerSaving, setPartnerSaving] = useState(false);
  const [distanceData, setDistanceData] = useState(null);
  const [distLoading, setDistLoading]   = useState(false);
  const [assignForm, setAssignForm] = useState({ driver_id: '', distance_miles: '', driver_payment: 0, partner_name: '', stock_source: '', admin_notes: '' });

  const load = (status, city) => {
    setLoading(true);
    const params = {};
    if (status && status !== 'All') params.status = status;
    if (city && city !== 'All') params.city = city;
    axios.get('/api/orders/all', { params, withCredentials: true })
      .then(r => setOrders(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filter, cityFilter);
    axios.get('/api/drivers', { withCredentials: true }).then(r => setDrivers(r.data)).catch(console.error);
    axios.get('/api/cities', { withCredentials: true }).then(r => setCities(r.data)).catch(() => {});
  }, [filter, cityFilter]);

  const openOrder = async (order) => {
    setSelected(order);
    setModalTab(order.is_partner_order ? 'partner' : 'driver');
    setPartnerForm({ partner_name: order.partner_name || '', partner_whatsapp: order.partner_whatsapp || '' });
    setDistanceData(null);
    setAssignForm({ driver_id: order.assigned_driver?._id || '', distance_miles: order.distance_miles || '', partner_name: order.partner_name || '', stock_source: order.stock_source || '', admin_notes: order.admin_notes || '' });
    setDistLoading(true);
    try {
      const r = await axios.get('/api/orders/distance', { params: { postcode: order.postcode }, withCredentials: true });
      setDistanceData(r.data);
    } catch { setDistanceData({ error: true, drivers: [] }); }
    finally { setDistLoading(false); }
  };

  const openWhatsApp = () => {
    if (!partnerForm.partner_whatsapp) { alert('Please enter the partner\'s WhatsApp number.'); return; }
    const num = partnerForm.partner_whatsapp.replace(/\D/g, '');
    const m = [`*New Order — ${selected.order_ref}*`, ``, `Customer: ${selected.customer_name}`, `Phone: ${selected.phone}`, `Address: ${selected.address}, ${selected.postcode}`, `Product: ${selected.product_name}`, `Quantity: ${selected.quantity}`, `Amount: £${Number(selected.total_amount).toFixed(2)} (Cash on Delivery)`, ``, `Please confirm delivery via WhatsApp. Thank you!`].join('\n');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(m)}`, '_blank');
  };

  const sendToPartner = async () => {
    if (!partnerForm.partner_name.trim()) { alert('Please enter the partner name.'); return; }
    setPartnerSaving(true);
    try {
      await axios.put(`/api/orders/${selected._id}/partner`, partnerForm, { withCredentials: true });
      setMsg('Order sent to partner.'); setTimeout(() => setMsg(''), 3000);
      setSelected(null); load(filter, cityFilter);
    } catch (e) { alert(e.response?.data?.error || 'Failed.'); }
    finally { setPartnerSaving(false); }
  };

  const updatePartnerStatus = async (status) => {
    if (!window.confirm(`Mark this partner order as ${status}?`)) return;
    try {
      await axios.put(`/api/orders/${selected._id}/partner-status`, { status }, { withCredentials: true });
      setMsg(`Order marked as ${status}.`); setTimeout(() => setMsg(''), 3000);
      setSelected(null); load(filter, cityFilter);
    } catch (e) { alert(e.response?.data?.error || 'Failed.'); }
  };

  const assignDriver = async () => {
    try {
      await axios.put(`/api/orders/${selected._id}/assign`, assignForm, { withCredentials: true });
      setMsg('Order updated!'); setTimeout(() => setMsg(''), 3000);
      setSelected(null); load(filter, cityFilter);
    } catch { alert('Failed to update order.'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtMoney = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const labelStyle = { display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '9px 12px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', boxSizing: 'border-box', marginBottom: 12 };

  return (
    <>
      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 22, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #2a2a4a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Order: <span style={{ color: '#2ecc71', fontFamily: 'monospace' }}>{selected.order_ref}</span></h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#111', borderRadius: 10, padding: '14px 16px', marginBottom: 18, fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Customer', selected.customer_name],
                ['Phone', selected.phone],
                ['Address', selected.address],
                ['Postcode', selected.postcode],
                ['Product', `${selected.product_name} × ${selected.quantity}`],
                ['Sale', fmtMoney(selected.total_amount)],
                ...(selected.driver_payment > 0 ? [['Driver Pay', fmtMoney(selected.driver_payment)]] : []),
                ...(selected.distance_miles > 0  ? [['Distance',  `${selected.distance_miles} mi`]]   : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#666', minWidth: 80, flexShrink: 0 }}>{k}:</span>
                  <strong style={{ color: '#fff' }}>{v}</strong>
                </div>
              ))}
              {!selected.is_partner_order && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#666', minWidth: 80 }}>Profit:</span>
                  <strong style={{ color: selected.profit >= 0 ? '#2ecc71' : '#e74c3c' }}>{fmtMoney(selected.profit)}</strong>
                </div>
              )}
            </div>

            {/* Distance */}
            <h4 style={{ color: '#fff', marginBottom: 10, fontSize: '0.92rem' }}>Distance from Drivers</h4>
            {distLoading && <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 12 }}>Calculating distances…</p>}
            {!distLoading && distanceData && !distanceData.error && distanceData.drivers.map(d => (
              <div key={d._id} onClick={() => {
                if (d.distance_miles == null) return;
                const driverPay = parseFloat((d.payment_per_mile * d.distance_miles).toFixed(2));
                setAssignForm(prev => ({
                  ...prev,
                  driver_id: d._id,
                  distance_miles: d.distance_miles,
                  driver_payment: driverPay,
                }));
              }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', marginBottom: 8, borderRadius: 10, border: `1.5px solid ${assignForm.driver_id === d._id ? '#2ecc71' : '#2a2a4a'}`, background: assignForm.driver_id === d._id ? '#0d2e1a' : '#111', cursor: d.distance_miles != null ? 'pointer' : 'default', opacity: d.distance_miles == null ? 0.5 : 1 }}>
                <div>
                  <strong style={{ color: '#fff' }}>{d.name}</strong>
                  <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: 8 }}>({d.city})</span>
                  <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 8 }}>£{Number(d.payment_per_mile || 0).toFixed(2)}/mi</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f39c12', fontWeight: 700, fontSize: '0.9rem' }}>{d.distance_miles != null ? `${d.distance_miles} mi` : 'No postcode'}</div>
                  {d.distance_miles != null && (
                    <div style={{ color: '#e74c3c', fontSize: '0.78rem', fontWeight: 600 }}>
                      Pay: £{(d.payment_per_mile * d.distance_miles).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live profit preview — shown when a driver is selected */}
            {assignForm.driver_id && assignForm.driver_payment != null && (
              <div style={{ background: '#0a1a0a', border: '1px solid #2ecc7144', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Profit Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Sale Price</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>£{Number(selected.total_amount).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Stock Cost</span>
                    <span style={{ color: '#e74c3c', fontWeight: 600 }}>− £{Number(selected.cost_price).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Driver Pay ({assignForm.distance_miles} mi)</span>
                    <span style={{ color: '#e74c3c', fontWeight: 600 }}>− £{Number(assignForm.driver_payment).toFixed(2)}</span>
                  </div>
                  <div style={{ height: 1, background: '#2a2a4a', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>Net Profit</span>
                    <span style={{
                      fontWeight: 800, fontSize: '1.05rem',
                      color: (selected.total_amount - selected.cost_price - assignForm.driver_payment) >= 0 ? '#2ecc71' : '#e74c3c'
                    }}>
                      £{(selected.total_amount - selected.cost_price - assignForm.driver_payment).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab switcher */}
            {!['Delivered', 'Cancelled'].includes(selected.status) && (
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 9, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
                {[['driver','Assign Driver'],['partner','Send to Partner']].map(([id, label]) => (
                  <button key={id} onClick={() => setModalTab(id)} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: modalTab === id ? (id === 'partner' ? '#2a0f3a' : '#0f2a3a') : '#111', color: modalTab === id ? (id === 'partner' ? '#a569bd' : '#5dade2') : '#666' }}>{label}</button>
                ))}
              </div>
            )}

            {['Delivered', 'Cancelled'].includes(selected.status) ? (
              <div style={{ background: '#111', borderRadius: 10, padding: '16px 18px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: selected.status === 'Delivered' ? '#2ecc71' : '#e74c3c', fontWeight: 700, marginBottom: 6 }}>{selected.status === 'Delivered' ? '✓ Order Delivered' : '✕ Order Cancelled'}</div>
                <p style={{ color: '#666', fontSize: '0.82rem', margin: '0 0 14px' }}>This order is {selected.status.toLowerCase()} and cannot be modified.</p>
                <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Close</button>
              </div>
            ) : selected.is_partner_order || modalTab === 'partner' ? (
              selected.status === 'Partner' ? (
                <div>
                  <div style={{ background: '#1a0f2e', border: '1px solid #9b59b644', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ color: '#9b59b6', fontWeight: 700, marginBottom: 4 }}>Partner: <span style={{ color: '#fff' }}>{selected.partner_name}</span></div>
                    {selected.partner_whatsapp && <div style={{ color: '#666', fontSize: '0.8rem' }}>WhatsApp: {selected.partner_whatsapp}</div>}
                  </div>
                  {selected.partner_whatsapp && <button onClick={openWhatsApp} style={{ width: '100%', marginBottom: 10, padding: '10px', background: '#0d2e1a', border: '1px solid #25D36644', color: '#25D366', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Re-open WhatsApp</button>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Close</button>
                    <button onClick={() => updatePartnerStatus('Cancelled')} style={{ flex: 1, padding: '10px', background: '#2e0d0d', border: '1px solid #e74c3c44', color: '#e74c3c', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Cancel Order</button>
                    <button onClick={() => updatePartnerStatus('Delivered')} style={{ flex: 2, padding: '10px', background: '#2ecc71', border: 'none', color: '#000', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>✓ Delivered</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background: '#1a0f2e', border: '1px solid #9b59b633', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '0.82rem', color: '#888' }}>Note: Stock will be returned to inventory. No profit tracked.</div>
                  <label style={labelStyle}>Partner Name *</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Ali's Store" value={partnerForm.partner_name} onChange={e => setPartnerForm(p => ({ ...p, partner_name: e.target.value }))} />
                  <label style={labelStyle}>Partner WhatsApp</label>
                  <input style={inputStyle} type="text" placeholder="+44 7700 000000" value={partnerForm.partner_whatsapp} onChange={e => setPartnerForm(p => ({ ...p, partner_whatsapp: e.target.value }))} />
                  <button onClick={openWhatsApp} style={{ width: '100%', marginBottom: 12, padding: '11px', background: '#0d2e1a', border: '1px solid #25D36644', color: '#25D366', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Open WhatsApp</button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={sendToPartner} disabled={partnerSaving} style={{ flex: 2, padding: '10px', background: partnerSaving ? '#1a0f2e' : '#9b59b6', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: partnerSaving ? 'not-allowed' : 'pointer' }}>{partnerSaving ? 'Sending…' : 'Send to Partner'}</button>
                  </div>
                </>
              )
            ) : (
              <>
                <h4 style={{ color: '#fff', marginBottom: 12, fontSize: '0.92rem' }}>Assignment Details</h4>
                <label style={labelStyle}>Select Driver</label>
                <select style={inputStyle} value={assignForm.driver_id} onChange={e => setAssignForm(p => ({ ...p, driver_id: e.target.value }))}>
                  <option value="">— No Driver —</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.city})</option>)}
                </select>
                <label style={labelStyle}>Distance (miles)</label>
                <input style={inputStyle} type="number" step="0.1" min="0" value={assignForm.distance_miles} onChange={e => setAssignForm(p => ({ ...p, distance_miles: e.target.value }))} placeholder="Auto-filled above" />
                <label style={labelStyle}>Stock Source</label>
                <select style={inputStyle} value={assignForm.stock_source} onChange={e => setAssignForm(p => ({ ...p, stock_source: e.target.value }))}>
                  <option value="">— Auto —</option>
                  {cities.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  <option value="Partner">Partner / External</option>
                </select>
                <label style={labelStyle}>Admin Notes</label>
                <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={assignForm.admin_notes} onChange={e => setAssignForm(p => ({ ...p, admin_notes: e.target.value }))} placeholder="Internal notes…" />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={assignDriver} style={{ padding: '10px 24px', background: '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>{assignForm.driver_id ? 'Assign Driver' : 'Update Order'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">Orders</span>
        {msg && <span className="success-msg">✓ {msg}</span>}
      </div>

      {/* Status tabs — scrollable row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${filter === s ? '#2ecc71' : '#2a2a4a'}`, background: filter === s ? '#0d2e1a' : 'transparent', color: filter === s ? '#2ecc71' : '#666', fontWeight: filter === s ? 700 : 400, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{s}</button>
        ))}
      </div>

      {/* City filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', ...cities.map(c => c.name)].map(c => (
          <button key={c} onClick={() => setCityFilter(c)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${cityFilter === c ? '#3498db' : '#2a2a4a'}`, background: cityFilter === c ? '#0d1e3a' : 'transparent', color: cityFilter === c ? '#5dade2' : '#666', fontWeight: cityFilter === c ? 700 : 400, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{c}</button>
        ))}
      </div>

      {loading && <p style={{ color: '#666', padding: 20 }}>Loading…</p>}
      {!loading && orders.length === 0 && <p style={{ color: '#555', padding: 20, textAlign: 'center' }}>No orders found.</p>}

      {/* Order cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.map(o => {
          const cityName = (o.city && o.city !== 'Other') ? o.city : cityFromPostcode(o.postcode) || '—';
          return (
            <div key={o._id} style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', padding: '14px 16px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: 3 }}>{o.order_ref}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{o.customer_name}</div>
                  <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 2 }}>{o.postcode} · {cityName}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: statusColor(o.status) + '22', color: statusColor(o.status), border: `1px solid ${statusColor(o.status)}44`, whiteSpace: 'nowrap' }}>{o.status}</span>
              </div>

              {/* Details row */}
              <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ color: '#888' }}>{o.product_name}</span>
                <span style={{ color: '#2ecc71', fontWeight: 700 }}>£{Number(o.total_amount).toFixed(2)}</span>
                {!o.is_partner_order && (
                  <span style={{ color: o.profit >= 0 ? '#2ecc71' : '#e74c3c' }}>
                    Profit: £{Number(o.profit).toFixed(2)}
                  </span>
                )}
                {!o.is_partner_order && o.driver_payment > 0 && (
                  <span style={{ color: '#e67e22' }}>Driver: £{Number(o.driver_payment).toFixed(2)}</span>
                )}
                {o.is_partner_order && <span style={{ color: '#9b59b6', fontSize: '0.78rem' }}>Partner</span>}
              </div>

              {/* Bottom row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#555', fontSize: '0.75rem' }}>
                  {o.assigned_driver?.name ? <span style={{ color: '#5dade2' }}>{o.assigned_driver.name}</span> : o.partner_name ? <span style={{ color: '#9b59b6' }}>{o.partner_name}</span> : <span>Unassigned</span>}
                  <span style={{ marginLeft: 8 }}>{fmtDate(o.created_at)}</span>
                </div>
                <button onClick={() => openOrder(o)} style={{ background: ['Delivered','Cancelled'].includes(o.status) ? '#1a1a2e' : '#0f3460', border: `1px solid ${['Delivered','Cancelled'].includes(o.status) ? '#2a2a4a' : '#1a4a80'}`, color: ['Delivered','Cancelled'].includes(o.status) ? '#555' : '#5dade2', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  {['Delivered','Cancelled'].includes(o.status) ? 'View' : 'Manage'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}