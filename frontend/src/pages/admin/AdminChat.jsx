import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const cfg = { withCredentials: true };

const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtAgo  = d => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return fmtDate(d);
};

export default function AdminChat() {
  const [chats,    setChats]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('open');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const loadChats = useCallback(() => {
    axios.get('/api/chats/admin/all', cfg)
      .then(r => setChats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const r = await axios.get(`/api/chats/admin/${chatId}/messages`, cfg);
      setMessages(r.data.messages || []);
      axios.put(`/api/chats/admin/${chatId}/read`, {}, cfg).catch(() => {});
      setChats(prev => prev.map(c => c._id === chatId ? { ...c, unread_admin: 0 } : c));
    } catch {}
  }, []);

  useEffect(() => {
    loadChats();
    const iv = setInterval(loadChats, 15000);
    return () => clearInterval(iv);
  }, [loadChats]);

  useEffect(() => {
    if (!selected) { clearInterval(pollRef.current); return; }
    loadMessages(selected._id);
    const iv = setInterval(() => loadMessages(selected._id), 5000);
    pollRef.current = iv;
    return () => clearInterval(iv);
  }, [selected, loadMessages]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  const openChat = chat => { setSelected(chat); setText(''); };
  const backToList = () => setSelected(null);

  const sendMessage = async e => {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    const t = text.trim();
    setText('');
    try {
      await axios.post(`/api/chats/admin/${selected._id}/messages`, { text: t }, cfg);
      await loadMessages(selected._id);
      loadChats();
    } catch { setText(t); alert('Failed to send.'); }
    finally { setSending(false); }
  };

  const closeChat = async () => {
    if (!window.confirm('Close this chat conversation?')) return;
    await axios.put(`/api/chats/admin/${selected._id}/close`, {}, cfg);
    setSelected(s => ({ ...s, status: 'closed' }));
    loadChats();
  };

  const deleteChat = async id => {
    if (!window.confirm('Delete this conversation? All messages will be lost.')) return;
    await axios.delete(`/api/chats/admin/${id}`, cfg);
    if (selected?._id === id) setSelected(null);
    loadChats();
  };

  const totalUnread = chats.reduce((s, c) => s + (c.unread_admin || 0), 0);
  const filtered    = chats.filter(c => filter === 'all' ? true : c.status === filter);

  const showList = !isMobile || !selected;
  const showChat = !isMobile || selected;

  const ConversationList = (
    <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a4a', color: '#888', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Conversations ({filtered.length})
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <p style={{ color: '#555', padding: 16, fontSize: '0.85rem' }}>Loading...</p>}
        {!loading && filtered.length === 0 && (
          <p style={{ color: '#555', padding: 16, fontSize: '0.85rem', textAlign: 'center' }}>No conversations yet.</p>
        )}
        {filtered.map(c => (
          <div key={c._id} onClick={() => openChat(c)} style={{
            padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #111',
            background: selected?._id === c._id ? '#0f2040' : 'transparent',
            borderLeft: `3px solid ${selected?._id === c._id ? '#2ecc71' : 'transparent'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{c.customer_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.unread_admin > 0 && (
                  <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>{c.unread_admin}</span>
                )}
                <span style={{ color: '#555', fontSize: '0.68rem' }}>{fmtAgo(c.updated_at || c.created_at)}</span>
              </div>
            </div>
            {c.customer_email && <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 1 }}>{c.customer_email}</div>}
            <div style={{ color: c.unread_admin > 0 ? '#ccc' : '#555', fontSize: '0.78rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.last_message || 'No messages yet'}
            </div>
            <div style={{ marginTop: 5 }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: c.status === 'open' ? '#0d2e1a' : '#1a1a0d', color: c.status === 'open' ? '#2ecc71' : '#888' }}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChatPanel = selected ? (
    <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button onClick={backToList} style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px 0 0', display: 'flex', alignItems: 'center' }}>
              &lt;
            </button>
          )}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{selected.customer_name}</div>
            {selected.customer_email && <div style={{ color: '#555', fontSize: '0.78rem' }}>{selected.customer_email}</div>}
            <div style={{ color: selected.status === 'open' ? '#2ecc71' : '#888', fontSize: '0.75rem', marginTop: 2 }}>
              {selected.status === 'open' ? 'Open' : 'Closed'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.status === 'open' && (
            <button onClick={closeChat} style={{ padding: '6px 12px', background: 'none', border: '1px solid #e67e22', color: '#e67e22', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
              Close
            </button>
          )}
          <button onClick={() => deleteChat(selected._id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ color: '#555', textAlign: 'center', fontSize: '0.85rem', marginTop: 20 }}>No messages yet.</p>
        )}
        {messages.map((m, i) => {
          const isAdmin  = m.sender === 'admin';
          const showDate = i === 0 || fmtDate(messages[i-1].created_at) !== fmtDate(m.created_at);
          return (
            <div key={m._id}>
              {showDate && (
                <div style={{ textAlign: 'center', color: '#444', fontSize: '0.72rem', margin: '8px 0 4px' }}>{fmtDate(m.created_at)}</div>
              )}
              <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%', padding: '10px 14px',
                  borderRadius: isAdmin ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: isAdmin ? '#0f3460' : '#2a2a4a',
                  color: '#fff', fontSize: '0.88rem', lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: '0.72rem', color: isAdmin ? '#5dade2' : '#888', marginBottom: 4, fontWeight: 600 }}>
                    {isAdmin ? 'You (Admin)' : selected.customer_name}
                  </div>
                  {m.text}
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 5, textAlign: 'right' }}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {selected.status === 'closed' ? (
        <div style={{ padding: '14px 18px', borderTop: '1px solid #2a2a4a', color: '#555', textAlign: 'center', fontSize: '0.85rem' }}>
          Chat is closed.
        </div>
      ) : (
        <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', gap: 10 }}>
          <input
            style={{ flex: 1, padding: '10px 14px', background: '#111', border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Type a reply..."
          />
          <button type="submit" disabled={!text.trim() || sending} style={{
            padding: '10px 20px', background: text.trim() ? '#2ecc71' : '#1a3a1a',
            border: 'none', color: text.trim() ? '#000' : '#555',
            fontWeight: 700, borderRadius: 8, cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: '0.9rem',
          }}>
            {sending ? '...' : 'Send'}
          </button>
        </form>
      )}
    </div>
  ) : (
    <div style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.9rem', height: '100%' }}>
      Select a conversation
    </div>
  );

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-title">Customer Chat</span>
          {totalUnread > 0 && (
            <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
              {totalUnread} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
          {[['open','Open'],['closed','Closed'],['all','All']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              background: filter === id ? '#2ecc71' : '#111', color: filter === id ? '#000' : '#666',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
        gap: 16,
        marginTop: 20,
        height: 'calc(100vh - 160px)',
      }}>
        {showList && ConversationList}
        {showChat && ChatPanel}
      </div>
    </>
  );
}