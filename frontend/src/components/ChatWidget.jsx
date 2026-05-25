import { useState, useEffect, useRef, useCallback } from 'react';
import axios from './axiosConfig';
import { useCustomer } from '../context/CustomerContext';

const STORAGE_KEY = 'ecr_chat_id';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .chat-widget * {
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Scrollbar */
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* Animations */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes ripple {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 12px rgba(46,204,113,0.4), 0 8px 32px rgba(0,0,0,0.4); }
    50%       { box-shadow: 0 0 24px rgba(46,204,113,0.7), 0 8px 32px rgba(0,0,0,0.4); }
  }

  .chat-window {
    animation: slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .chat-message-row {
    animation: fadeIn 0.2s ease forwards;
  }

  /* Toggle button */
  .chat-toggle-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease;
    animation: glow 2.5s ease-in-out infinite;
  }
  .chat-toggle-btn:hover {
    transform: scale(1.06);
  }
  .chat-toggle-btn:active {
    transform: scale(0.96);
  }
  .chat-toggle-btn .ripple {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(46,204,113,0.35);
    animation: ripple 1.8s ease-out infinite;
    pointer-events: none;
  }

  /* Input focus */
  .chat-input:focus {
    border-color: rgba(46,204,113,0.5) !important;
    background: rgba(255,255,255,0.1) !important;
    box-shadow: 0 0 0 3px rgba(46,204,113,0.12);
  }
  .chat-input::placeholder { color: rgba(255,255,255,0.3); }

  /* Send button */
  .send-btn {
    transition: all 0.18s ease;
  }
  .send-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(46,204,113,0.5);
  }
  .send-btn:active:not(:disabled) {
    transform: scale(0.94);
  }

  /* Message bubble hover */
  .msg-bubble {
    transition: transform 0.15s ease;
  }
  .msg-bubble:hover {
    transform: scale(1.01);
  }

  /* Start button */
  .start-btn {
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .start-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.2s;
  }
  .start-btn:hover:not(:disabled)::after {
    background: rgba(255,255,255,0.12);
  }
  .start-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  /* Typing dots */
  .dot { animation: bounce 1s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.30s; }
`;

export default function ChatWidget() {
  const { customer, getToken } = useCustomer();

  const [open,        setOpen]        = useState(false);
  const [chatId,      setChatId]      = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState('');
  const [unread,      setUnread]      = useState(0);
  const [sending,     setSending]     = useState(false);
  const [starting,    setStarting]    = useState(false);
  const [guestName,   setGuestName]   = useState('');
  const [guestEmail,  setGuestEmail]  = useState('');
  const [chatInfo,    setChatInfo]    = useState(null);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 600);
  const [newMsgAlert, setNewMsgAlert] = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const scrollBoxRef = useRef(null);
  const userScrolled = useRef(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile) return;
    window.history.pushState({ chatOpen: true }, '');
    const handlePop = () => setOpen(false);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [open, isMobile]);

  const handleScroll = () => {
    const el = scrollBoxRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolled.current = !isNearBottom;
    if (isNearBottom) setNewMsgAlert(false);
  };

  const scrollBottom = (force = false) => {
    setTimeout(() => {
      if (force || !userScrolled.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMsgAlert(false);
      } else {
        setNewMsgAlert(true);
      }
    }, 80);
  };

  const fetchMessages = useCallback(async (id) => {
    if (!id) return;
    try {
      const r = await axios.get(`/api/chats/${id}/messages`);
      setMessages(r.data.messages || []);
      setChatInfo(r.data.chat);
      const adminMsgs = (r.data.messages || []).filter(m => m.sender === 'admin');
      const lastRead  = parseInt(localStorage.getItem(`ecr_chat_read_${id}`) || '0');
      const newCount  = adminMsgs.filter(m => new Date(m.created_at).getTime() > lastRead).length;
      if (!open) setUnread(newCount);
      else { setUnread(0); axios.put(`/api/chats/${id}/read-customer`).catch(() => {}); }
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 500) {
        localStorage.removeItem(STORAGE_KEY);
        setChatId(null);
        setChatInfo(null);
        setMessages([]);
      }
    }
  }, [open]);

  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    const iv = setInterval(() => fetchMessages(chatId), open ? 5000 : 20000);
    return () => clearInterval(iv);
  }, [chatId, open, fetchMessages]);

  useEffect(() => {
    if (open) {
      const el = scrollBoxRef.current;
      if (!el) return scrollBottom(true);
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      scrollBottom(isNearBottom);
    }
  }, [messages, open]);

  const startChat = async () => {
    setStarting(true);
    try {
      const name  = customer?.full_name || guestName.trim();
      const email = customer?.email     || guestEmail.trim();
      if (!name) { alert('Please enter your name.'); setStarting(false); return; }
      const headers = {};
      if (getToken?.()) headers.Authorization = `Bearer ${getToken()}`;
      const r = await axios.post('/api/chats/start',
        { customer_name: name, customer_email: email },
        { headers }
      );
      const id = r.data._id;
      if (!id) throw new Error('Invalid response from server');
      setChatId(id);
      setChatInfo(r.data);
      localStorage.setItem(STORAGE_KEY, id);
      await fetchMessages(id);
      userScrolled.current = false;
      scrollBottom(true);
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      setChatId(null);
      alert('Could not start chat. Please try again.');
    }
    finally { setStarting(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !chatId || sending) return;
    setSending(true);
    setText('');
    try {
      await axios.post(`/api/chats/${chatId}/messages`, { text: msg });
      await fetchMessages(chatId);
      userScrolled.current = false;
      scrollBottom(true);
      inputRef.current?.focus();
    } catch (err) {
      setText(msg);
      if (err?.response?.status === 404) {
        localStorage.removeItem(STORAGE_KEY);
        setChatId(null);
        setChatInfo(null);
        setMessages([]);
        alert('Chat session expired. Please start a new chat.');
      } else {
        alert('Failed to send. Please try again.');
      }
    } finally { setSending(false); }
  };

  const closeChat = () => {
    if (isMobile && window.history.state?.chatOpen) window.history.back();
    else setOpen(false);
  };

  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = d => {
    const today = new Date();
    const date  = new Date(d);
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const isClosed = chatInfo?.status === 'closed';

  /* ─── Layout values ─── */
  const W = isMobile ? '100vw' : '380px';
  const H = isMobile ? '100dvh' : '560px';
  const BOTTOM = isMobile ? 0 : '90px';
  const RIGHT  = isMobile ? 0 : '20px';
  const RADIUS = isMobile ? '0px' : '20px';

  return (
    <>
      <style>{styles}</style>

      {/* ── CHAT WINDOW ── */}
      {open && (
        <div
          className="chat-widget chat-window"
          style={{
            position: 'fixed',
            bottom: BOTTOM, right: RIGHT,
            width: W, height: H,
            background: 'linear-gradient(160deg, #0d1b2a 0%, #0f2339 60%, #0a1a28 100%)',
            borderRadius: RADIUS,
            border: isMobile ? 'none' : '1px solid rgba(46,204,113,0.18)',
            boxShadow: isMobile ? 'none' : '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9001,
          }}
        >
          {/* ── HEADER ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0a2540 0%, #0d3060 100%)',
            padding: isMobile ? '18px 20px 16px' : '16px 18px 14px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(46,204,113,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* decorative glow blob */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(46,204,113,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              {/* Avatar */}
              <div style={{
                width: isMobile ? 46 : 40, height: isMobile ? 46 : 40,
                borderRadius: '50%',
                background: 'rgba(46,204,113,0.15)',
                border: '2px solid rgba(46,204,113,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                boxShadow: '0 0 16px rgba(46,204,113,0.25)',
              }}>
                <img src="/images/logo.png" alt="logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#fff', fontWeight: 700,
                  fontSize: isMobile ? '1rem' : '0.92rem',
                  letterSpacing: '-0.01em',
                }}>EcoRide UK Support</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: isClosed ? '#e74c3c' : '#2ecc71',
                    display: 'inline-block',
                    boxShadow: isClosed ? 'none' : '0 0 6px #2ecc71',
                    animation: isClosed ? 'none' : 'pulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ color: isClosed ? '#e74c3c' : '#5dde95', fontSize: isMobile ? '0.75rem' : '0.7rem', fontWeight: 500 }}>
                    {isClosed ? 'Chat closed' : "We'll reply shortly"}
                  </span>
                </div>
              </div>

              {/* Close button */}
              <button onClick={closeChat} style={{
                width: isMobile ? 36 : 32, height: isMobile ? 36 : 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.25)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >✕</button>
            </div>
          </div>

          {/* ── START CHAT FORM ── */}
          {!chatId ? (
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: isMobile ? '32px 24px 28px' : '24px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div style={{
                  fontSize: isMobile ? '2.4rem' : '2rem',
                  marginBottom: 10, lineHeight: 1,
                }}>👋</div>
                <div style={{
                  color: '#fff', fontWeight: 800,
                  fontSize: isMobile ? '1.2rem' : '1.05rem',
                  letterSpacing: '-0.02em', marginBottom: 8,
                }}>Hi there!</div>
                <p style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: isMobile ? '0.9rem' : '0.84rem',
                  margin: 0, lineHeight: 1.65,
                }}>Need help? Drop us a message and our team will get back to you shortly.</p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              {!customer ? (
                <>
                  {/* Name input */}
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Your Name *</label>
                    <input
                      className="chat-input"
                      style={{
                        width: '100%',
                        padding: isMobile ? '14px 16px' : '12px 15px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: '#fff',
                        fontSize: isMobile ? '1rem' : '0.92rem',
                        outline: 'none', transition: 'all 0.2s',
                      }}
                      type="text" placeholder="John Smith"
                      value={guestName} onChange={e => setGuestName(e.target.value)} />
                  </div>

                  {/* Email input */}
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <input
                      className="chat-input"
                      style={{
                        width: '100%',
                        padding: isMobile ? '14px 16px' : '12px 15px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: '#fff',
                        fontSize: isMobile ? '1rem' : '0.92rem',
                        outline: 'none', transition: 'all 0.2s',
                      }}
                      type="email" placeholder="you@example.com"
                      value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                  </div>
                </>
              ) : (
                <div style={{
                  background: 'rgba(46,204,113,0.08)',
                  border: '1px solid rgba(46,204,113,0.2)',
                  borderRadius: 12, padding: '13px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(46,204,113,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', flexShrink: 0,
                  }}>✓</div>
                  <div>
                    <div style={{ color: '#2ecc71', fontSize: '0.75rem', fontWeight: 600 }}>Logged in as</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{customer.full_name}</div>
                  </div>
                </div>
              )}

              <button
                className="start-btn"
                onClick={startChat}
                disabled={starting}
                style={{
                  padding: isMobile ? '16px' : '14px',
                  background: starting
                    ? 'rgba(46,204,113,0.3)'
                    : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                  border: 'none', color: starting ? 'rgba(255,255,255,0.5)' : '#000',
                  fontWeight: 800, borderRadius: 14,
                  cursor: starting ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '1rem' : '0.94rem',
                  marginTop: 4, letterSpacing: '-0.01em',
                  boxShadow: starting ? 'none' : '0 4px 20px rgba(46,204,113,0.35)',
                }}>
                {starting
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                      <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                      <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                    </span>
                  : '💬  Start Chatting'}
              </button>

              {/* Trust line */}
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', margin: '2px 0 0', lineHeight: 1.5 }}>
                🔒 Your info is safe with us
              </p>
            </div>
          ) : (
            <>
              {/* ── MESSAGES AREA ── */}
              <div
                ref={scrollBoxRef}
                className="chat-messages"
                onScroll={handleScroll}
                style={{
                  flex: 1, overflowY: 'auto',
                  padding: isMobile ? '18px 16px' : '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>💬</div>
                    No messages yet — say hello!
                  </div>
                )}

                {messages.map((m, i) => {
                  const isAdmin  = m.sender === 'admin';
                  const showDate = i === 0 || fmtDate(messages[i - 1].created_at) !== fmtDate(m.created_at);
                  const prevSame = i > 0 && messages[i - 1].sender === m.sender;

                  return (
                    <div key={m._id} className="chat-message-row">
                      {showDate && (
                        <div style={{
                          textAlign: 'center', margin: '12px 0 8px',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                          <span style={{
                            color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem',
                            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>{fmtDate(m.created_at)}</span>
                          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                        alignItems: 'flex-end', gap: 8,
                        marginTop: prevSame && !showDate ? 2 : 8,
                      }}>
                        {/* Admin avatar */}
                        {isAdmin && (
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'rgba(46,204,113,0.15)',
                            border: '1px solid rgba(46,204,113,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700, color: '#2ecc71',
                            flexShrink: 0, marginBottom: 2,
                            visibility: prevSame && !showDate ? 'hidden' : 'visible',
                          }}>S</div>
                        )}

                        {/* Bubble */}
                        <div
                          className="msg-bubble"
                          style={{
                            maxWidth: '76%',
                            padding: isMobile ? '11px 15px' : '10px 14px',
                            borderRadius: isAdmin
                              ? (prevSame && !showDate ? '14px 18px 18px 6px' : '4px 18px 18px 18px')
                              : (prevSame && !showDate ? '18px 4px 6px 18px'  : '18px 18px 4px 18px'),
                            background: isAdmin
                              ? 'linear-gradient(135deg, rgba(13,45,80,0.95) 0%, rgba(15,52,96,0.9) 100%)'
                              : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                            color: isAdmin ? '#d8e8f0' : '#000',
                            fontSize: isMobile ? '0.95rem' : '0.875rem',
                            lineHeight: 1.55, wordBreak: 'break-word',
                            boxShadow: isAdmin
                              ? '0 2px 12px rgba(0,0,0,0.3)'
                              : '0 2px 12px rgba(46,204,113,0.25)',
                            border: isAdmin ? '1px solid rgba(46,204,113,0.1)' : 'none',
                          }}
                        >
                          {isAdmin && !prevSame && (
                            <div style={{ color: '#5dade2', fontSize: '0.65rem', fontWeight: 700, marginBottom: 5, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                              EcoRide Support
                            </div>
                          )}
                          <span>{m.text}</span>
                          <div style={{
                            fontSize: '0.6rem',
                            color: isAdmin ? 'rgba(100,160,200,0.6)' : 'rgba(0,100,50,0.7)',
                            marginTop: 5, textAlign: 'right',
                          }}>{fmtTime(m.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* ── NEW MESSAGE PILL ── */}
              {newMsgAlert && (
                <div
                  onClick={() => { userScrolled.current = false; scrollBottom(true); }}
                  style={{
                    position: 'absolute',
                    bottom: isClosed ? 60 : (isMobile ? 96 : 76),
                    left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                    color: '#000', fontWeight: 700,
                    padding: '7px 18px', borderRadius: 20, cursor: 'pointer',
                    fontSize: '0.78rem', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(46,204,113,0.4)',
                    zIndex: 10, letterSpacing: '-0.01em',
                  }}
                >↓ New message</div>
              )}

              {/* ── INPUT AREA ── */}
              {isClosed ? (
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(0,0,0,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.83rem', textAlign: 'center',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <span>🔒</span> This conversation has been closed
                </div>
              ) : (
                <form onSubmit={sendMessage} style={{
                  flexShrink: 0,
                  padding: isMobile ? '12px 14px 28px' : '10px 14px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <input
                    ref={inputRef}
                    className="chat-input"
                    style={{
                      flex: 1,
                      padding: isMobile ? '14px 18px' : '11px 15px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      borderRadius: 24, color: '#fff',
                      fontSize: isMobile ? '1rem' : '0.9rem',
                      outline: 'none', lineHeight: 1.4,
                      transition: 'all 0.2s',
                    }}
                    type="text" value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type a message…"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!text.trim() || sending}
                    style={{
                      width: isMobile ? 48 : 42,
                      height: isMobile ? 48 : 42,
                      borderRadius: '50%', flexShrink: 0,
                      background: text.trim() && !sending
                        ? 'linear-gradient(135deg, #2ecc71, #27ae60)'
                        : 'rgba(255,255,255,0.07)',
                      border: 'none',
                      color: text.trim() && !sending ? '#000' : 'rgba(255,255,255,0.2)',
                      cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isMobile ? '1.2rem' : '1.05rem',
                    }}
                  >
                    {sending ? (
                      <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TOGGLE BUTTON ── */}
      {!open && (
        <div style={{ position: 'fixed', bottom: 22, right: 18, zIndex: 9002 }}>
          <button
            className="chat-toggle-btn"
            onClick={() => setOpen(o => !o)}
            style={{
              height: isMobile ? 52 : 58,
              padding: isMobile ? '0 18px 0 14px' : '0 24px 0 18px',
              width: 'auto',
              borderRadius: 30,
              background: 'linear-gradient(135deg, #2ecc71 0%, #1ea855 100%)',
              boxShadow: '0 6px 28px rgba(46,204,113,0.5)',
            }}
          >
            <span className="ripple" />
            <span style={{ fontSize: isMobile ? '1.25rem' : '1.3rem', lineHeight: 1, position: 'relative', zIndex: 1 }}>
              💬
            </span>
            <span style={{
              color: '#000', fontWeight: 800,
              fontSize: isMobile ? '0.88rem' : '0.95rem',
              letterSpacing: '-0.01em',
              position: 'relative', zIndex: 1,
            }}>
              {isMobile ? 'Chat' : 'Chat with us'}
            </span>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#e74c3c', color: '#fff',
                borderRadius: '50%', width: 22, height: 22,
                fontSize: '0.68rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #0a1a28',
                boxShadow: '0 2px 8px rgba(231,76,60,0.5)',
                zIndex: 2,
              }}>{unread}</span>
            )}
          </button>
        </div>
      )}
    </>
  );
}