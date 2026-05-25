import { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';

const EMPTY = {
  title: '', description: '', source_type: 'youtube',
  video_url: '', sort_order: 0,
};

const imgSrc = i => {
  if (!i) return null;
  if (i.startsWith('http')) return i;
  return i;
};

export default function AdminVideos() {
  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');
  const [saving, setSaving]     = useState(false);
  const videoRef                = useRef();
  const thumbRef                = useRef();

  const load = () => {
    setLoading(true);
    axios.get('/api/videos/all', { withCredentials: true })
      .then(r => setVideos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setErr(''); }
    else     { setErr(text); setMsg(''); }
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  const startEdit = v => {
    setEditing(v._id);
    setForm({
      title: v.title, description: v.description || '',
      source_type: v.source_type, video_url: v.video_url || '',
      sort_order: v.sort_order || 0,
    });
    setVideoFile(null); setThumbFile(null);
    setThumbPreview(imgSrc(v.thumbnail) || v.auto_thumbnail || '');
    if (videoRef.current) videoRef.current.value = '';
    if (thumbRef.current) thumbRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null); setForm(EMPTY);
    setVideoFile(null); setThumbFile(null); setThumbPreview('');
    if (videoRef.current) videoRef.current.value = '';
    if (thumbRef.current) thumbRef.current.value = '';
  };

  const handleThumb = e => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const handleUrlChange = e => {
    const url = e.target.value;
    setForm(p => ({ ...p, video_url: url }));
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch && !thumbFile) {
      setThumbPreview(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
    }
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setErr(''); setMsg('');
    try {
      const data = new FormData();
      data.append('title',       form.title);
      data.append('description', form.description);
      data.append('source_type', form.source_type);
      data.append('video_url',   form.video_url);
      data.append('sort_order',  form.sort_order);
      if (videoFile) data.append('video_file', videoFile);
      if (thumbFile) data.append('thumbnail',  thumbFile);

      if (editing) {
        await axios.put(`/api/videos/${editing}`, data, { withCredentials: true });
        flash(true, 'Video updated.');
      } else {
        await axios.post('/api/videos', data, { withCredentials: true });
        flash(true, 'Video added.');
      }
      cancelEdit();
      load();
    } catch (e) {
      flash(false, e.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const toggleActive = async v => {
    try {
      const data = new FormData();
      data.append('is_active', String(!v.is_active));
      await axios.put(`/api/videos/${v._id}`, data, { withCredentials: true });
      load();
    } catch { flash(false, 'Failed to update.'); }
  };

  const deleteVideo = async id => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await axios.delete(`/api/videos/${id}`, { withCredentials: true });
      flash(true, 'Deleted.');
      load();
    } catch { flash(false, 'Failed to delete.'); }
  };

  const inp = {
    width: '100%', padding: '9px 12px', background: '#0d0d1a',
    border: '1px solid #3a3a5a', borderRadius: 8, color: '#fff',
    boxSizing: 'border-box', fontSize: '0.9rem',
  };
  const lbl = { display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: 5, fontWeight: 600 };
  const card = { background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a4a', overflow: 'hidden' };

  return (
    <>
      <div className="admin-topbar" style={{ marginBottom: 20 }}>
        <span className="page-title">{editing ? 'Edit Video' : 'Videos'}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <span style={{ color: '#2ecc71', fontSize: '0.9rem' }}>{msg}</span>}
          {err && <span style={{ color: '#e74c3c', fontSize: '0.9rem' }}>{err}</span>}
        </div>
      </div>

      <div style={{ ...card, padding: 24, marginBottom: 28 }}>
        <h3 style={{ color: '#fff', margin: '0 0 20px', fontSize: '1rem' }}>
          {editing ? 'Edit Video' : 'Add New Video'}
        </h3>

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Video Title *</label>
              <input style={inp} type="text" value={form.title} onChange={set('title')}
                placeholder="e.g. EcoRide Lightning Pro — Full Review" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Display Order (lower = first)</label>
              <input style={inp} type="number" min="0" value={form.sort_order} onChange={set('sort_order')} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Video Source</label>
              <select style={inp} value={form.source_type} onChange={set('source_type')}>
                <option value="youtube">YouTube Link</option>
                <option value="vimeo">Vimeo Link</option>
                <option value="upload">Upload MP4 File</option>
              </select>
            </div>

            {(form.source_type === 'youtube' || form.source_type === 'vimeo') && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  {form.source_type === 'youtube' ? 'YouTube URL' : 'Vimeo URL'}
                </label>
                <input style={inp} type="text" value={form.video_url} onChange={handleUrlChange}
                  placeholder={form.source_type === 'youtube'
                    ? 'https://www.youtube.com/watch?v=XXXXXXXXXXX'
                    : 'https://vimeo.com/123456789'} />
              </div>
            )}

            {form.source_type === 'upload' && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Upload Video File (MP4)</label>
                <input ref={videoRef} type="file" accept="video/mp4,video/webm,.mp4,.webm,.mov"
                  onChange={e => setVideoFile(e.target.files[0])}
                  style={{ ...inp, padding: '7px 12px' }} />
                {videoFile && <p style={{ color: '#2ecc71', fontSize: '0.78rem', marginTop: 4 }}>Selected: {videoFile.name}</p>}
              </div>
            )}

            <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
              <label style={lbl}>Description (optional)</label>
              <textarea style={{ ...inp, height: 60, resize: 'vertical' }}
                value={form.description} onChange={set('description')}
                placeholder="Short description shown below the video..." />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Custom Thumbnail</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, height: 56, borderRadius: 8, overflow: 'hidden', background: '#111', border: '1px dashed #3a3a5a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {thumbPreview
                    ? <img src={thumbPreview} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setThumbPreview('')} />
                    : <span style={{ color: '#444', fontSize: '0.7rem' }}>No thumb</span>
                  }
                </div>
                <div>
                  <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumb}
                    style={{ display: 'none' }} id="thumb-file" />
                  <label htmlFor="thumb-file" style={{ display: 'inline-block', padding: '7px 14px', background: '#0f3460', color: '#5dade2', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, border: '1px solid #1a4a80' }}>
                    {thumbFile ? thumbFile.name.slice(0, 20) : 'Choose Thumbnail'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: '11px 28px', background: saving ? '#1a5c35' : '#2ecc71', border: 'none', color: '#000', fontWeight: 700, borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : editing ? 'Update Video' : 'Add Video'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} style={{ padding: '11px 24px', border: '1px solid #444', background: 'none', color: '#aaa', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a4a' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>
            All Videos <span style={{ color: '#555', fontWeight: 400, marginLeft: 8, fontSize: '0.85rem' }}>({videos.length})</span>
          </h3>
        </div>

        {loading && <p style={{ padding: 20, color: '#888' }}>Loading...</p>}
        {!loading && videos.length === 0 && <p style={{ padding: 20, color: '#666' }}>No videos yet.</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {videos.map(v => {
          const thumb = imgSrc(v.thumbnail) || v.auto_thumbnail || '';
          return (
            <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid #111', opacity: v.is_active ? 1 : 0.5 }}>
              <div style={{ width: 80, height: 52, borderRadius: 8, overflow: 'hidden', background: '#111', border: '1px solid #2a2a4a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {thumb
                  ? <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  : <span style={{ color: '#444', fontSize: '0.65rem' }}>No thumb</span>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 600, background: v.source_type === 'youtube' ? '#1a0d0d' : '#0d1a2e', color: v.source_type === 'youtube' ? '#e74c3c' : '#5dade2' }}>{v.source_type.toUpperCase()}</span>
                  <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 600, background: v.is_active ? '#0d2e1a' : '#2e0d0d', color: v.is_active ? '#2ecc71' : '#e74c3c' }}>{v.is_active ? 'Visible' : 'Hidden'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEdit(v)} style={{ background: '#0f3460', border: 'none', color: '#5dade2', padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                <button onClick={() => toggleActive(v)} style={{ background: v.is_active ? '#3a2a0d' : '#0d2e1a', border: 'none', color: v.is_active ? '#f39c12' : '#2ecc71', padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem' }}>{v.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => deleteVideo(v._id)} style={{ background: '#3a0d0d', border: 'none', color: '#e74c3c', padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem' }}>Del</button>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </>
  );
}