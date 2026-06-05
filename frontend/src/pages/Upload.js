import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMovie, getCategories } from '../utils/api';

export default function Upload() {
  const nav = useNavigate();
  const [form, setForm]           = useState({ title: '', description: '', category: 'Action' });
  const [video, setVideo]         = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.categories));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video)       return setError('Please select a video file.');
    if (!form.title)  return setError('Title is required.');

    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('title',       form.title);
    fd.append('description', form.description);
    fd.append('category',    form.category);
    fd.append('video',       video);
    if (thumbnail) fd.append('thumbnail', thumbnail);

    try {
      const r = await uploadMovie(fd, setProgress);
      nav(`/movie/${r.data.movie.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>📤 Upload a Movie</h1>
        <p style={styles.sub}>Your video is stored in S3 and streamed via CloudFront CDN.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Title *</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Enter movie title"
            required
          />

          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, height: '90px', resize: 'vertical' }}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description (optional)"
          />

          <label style={styles.label}>Video File * (mp4, mkv, webm)</label>
          <input
            type="file"
            accept="video/*"
            style={styles.fileInput}
            onChange={e => setVideo(e.target.files[0])}
          />
          {video && <p style={styles.fileInfo}>📹 {video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)</p>}

          <label style={styles.label}>Thumbnail (optional)</label>
          <input
            type="file"
            accept="image/*"
            style={styles.fileInput}
            onChange={e => setThumbnail(e.target.files[0])}
          />

          {uploading && (
            <div style={styles.progressWrap}>
              <div style={{ ...styles.progressBar, width: `${progress}%` }} />
              <span style={styles.progressText}>{progress}% uploading to S3…</span>
            </div>
          )}

          <button type="submit" disabled={uploading} style={styles.submit}>
            {uploading ? `Uploading… ${progress}%` : '🚀 Upload to S3'}
          </button>
        </form>
      </div>

      {/* Architecture note */}
      <div style={styles.arch}>
        <h3 style={styles.archTitle}>Architecture</h3>
        <div style={styles.archFlow}>
          <span style={styles.archBox}>Browser</span>
          <span style={styles.arrow}>→</span>
          <span style={styles.archBox}>FastAPI (EC2)</span>
          <span style={styles.arrow}>→</span>
          <span style={{ ...styles.archBox, borderColor: '#e50914' }}>S3 Upload Bucket</span>
          <span style={styles.arrow}>→</span>
          <span style={{ ...styles.archBox, borderColor: '#f5c518' }}>CloudFront CDN</span>
          <span style={styles.arrow}>→</span>
          <span style={styles.archBox}>Stream</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '680px', margin: '2rem auto', padding: '0 1.5rem 4rem' },
  card: { background: '#1c1c27', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '2rem' },
  heading: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '0.05em', marginBottom: '0.3rem' },
  sub: { color: '#8888aa', fontSize: '0.9rem', marginBottom: '1.5rem' },
  error: { background: '#2a0a0a', border: '1px solid #e50914', borderRadius: '6px', padding: '0.75rem 1rem', color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  label: { color: '#aaaacc', fontSize: '0.85rem', fontWeight: 500 },
  input: { padding: '0.65rem 0.9rem', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#13131a', color: '#f0f0f5', fontSize: '0.95rem', outline: 'none', width: '100%' },
  fileInput: { color: '#aaaacc', fontSize: '0.9rem' },
  fileInfo: { color: '#8888aa', fontSize: '0.82rem' },
  progressWrap: { position: 'relative', background: '#13131a', borderRadius: '6px', height: '28px', overflow: 'hidden' },
  progressBar: { position: 'absolute', left: 0, top: 0, height: '100%', background: 'linear-gradient(90deg, #e50914, #ff6b35)', transition: 'width 0.3s' },
  progressText: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 },
  submit: { padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#e50914', color: '#fff', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', opacity: 1, transition: 'opacity 0.2s' },
  arch: { marginTop: '2rem', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '1.25rem' },
  archTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.06em', marginBottom: '0.8rem', color: '#8888aa' },
  archFlow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' },
  archBox: { padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#1c1c27', color: '#f0f0f5', fontSize: '0.82rem' },
  arrow: { color: '#e50914', fontWeight: 700 },
};
