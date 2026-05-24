import { useDriver } from '../../context/DriverContext';

const fmtMoney = n => `£${Number(n || 0).toFixed(2)}`;
const fmtDate  = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function DriverEarnings() {
  const { deliveredOrders, totalEarned, orders } = useDriver();

  const avgEarning = deliveredOrders.length
    ? (totalEarned / deliveredOrders.length).toFixed(2)
    : '0.00';

  const totalDistance = deliveredOrders.reduce((s, o) => s + (o.distance_miles || 0), 0);

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 24 }}>
        <span className="page-title">My Earnings</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Earned',        value: fmtMoney(totalEarned),   color: '#2ecc71' },
          { label: 'Deliveries Completed', value: deliveredOrders.length, color: '#3498db' },
          { label: 'Avg per Delivery',    value: `£${avgEarning}`,        color: '#f39c12' },
          { label: 'Total Miles Driven',  value: `${totalDistance.toFixed(1)} mi`, color: '#9b59b6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a2e', borderRadius: 12, border: `1px solid ${s.color}33`, padding: '18px 20px' }}>
            <div style={{ color: s.color, fontSize: '1.7rem', fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings table */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a4a' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Delivered Orders Breakdown</h3>
        </div>

        {deliveredOrders.length === 0 && (
          <p style={{ padding: 20, color: '#666' }}>No delivered orders yet. Your earnings will appear here after each delivery.</p>
        )}

        {deliveredOrders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111' }}>
                  {['Order Ref', 'Customer', 'Sale Price', 'Distance', 'Your Earning', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', color: '#555', fontSize: '0.75rem', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map((o, i) => (
                  <tr key={o._id} style={{ background: i % 2 === 0 ? '#111' : '#0f0f1e', borderBottom: '1px solid #1a1a2e' }}>
                    <td style={{ padding: '12px 16px', color: '#2ecc71', fontFamily: 'monospace', fontSize: '0.83rem' }}>{o.order_ref}</td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{o.customer_name}</td>
                    <td style={{ padding: '12px 16px', color: '#3498db', fontWeight: 600 }}>{fmtMoney(o.total_amount)}</td>
                    <td style={{ padding: '12px 16px', color: '#f39c12' }}>{o.distance_miles || 0} mi</td>
                    <td style={{ padding: '12px 16px', color: '#2ecc71', fontWeight: 700, fontSize: '1rem' }}>{fmtMoney(o.driver_payment)}</td>
                    <td style={{ padding: '12px 16px', color: '#555', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d2e1a', borderTop: '2px solid #2ecc71' }}>
                  <td colSpan={4} style={{ padding: '12px 16px', color: '#2ecc71', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '12px 16px', color: '#2ecc71', fontWeight: 800, fontSize: '1.1rem' }}>{fmtMoney(totalEarned)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}