import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovie, rateMovie, viewMovie, deleteMovie } from '../utils/api';

export default function MovieDetail() {
  const { id } = useParams();
  const nav     = useNavigate();
  const [movie, setMovie]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [rated, setRated]     = useState(false);
  const [hover, setHover]     = useState(0);

  useEffect(() => {
    getMovie(id)
      .then(r => { setMovie(r.data); viewMovie(id); })
      .catch(() => nav('/'))
      .finally(() => setLoading(false));
  }, [id, nav]);

  const handleRate = async (star) => {
    if (rated) return;
    const r = await rateMovie(id, star);
    setMovie(m => ({ ...m, rating: r.data.rating, rating_count: r.data.rating_count }));
    setRated(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this movie?')) return;
    await deleteMovie(id);
    nav('/');
  };

  if (loading) return <div style={styles.loading}>Loading…</div>;
  if (!movie)  return null;

  return (
    <div style={styles.page}>
      {/* Video Player */}
      <div style={styles.playerWrap}>
        <video
          src={movie.video_url}
          controls
          autoPlay
          style={styles.player}
          poster={movie.thumbnail || undefined}
        />
      </div>

      <div style={styles.content}>
        {/* Title + meta */}
        <div style={styles.header}>
          <div>
            <span style={styles.categoryBadge}>{movie.category}</span>
            <h1 style={styles.title}>{movie.title}</h1>
            <div style={styles.meta}>
              <span style={styles.views}>👁 {movie.views} views</span>
              <span style={styles.sep}>·</span>
              <span style={styles.ratingText}>⭐ {movie.rating?.toFixed(1) || '—'} ({movie.rating_count} ratings)</span>
            </div>
          </div>
          <button onClick={handleDelete} style={styles.deleteBtn}>🗑 Delete</button>
        </div>

        {/* Description */}
        {movie.description && <p style={styles.desc}>{movie.description}</p>}

        {/* Star Rating */}
        <div style={styles.ratingBox}>
          <p style={styles.rateLabel}>{rated ? '✅ Thanks for rating!' : 'Rate this movie:'}</p>
          <div style={styles.stars}>
            {[1,2,3,4,5].map(s => (
              <span
                key={s}
                onMouseEnter={() => !rated && setHover(s)}
                onMouseLeave={() => !rated && setHover(0)}
                onClick={() => handleRate(s)}
                style={{
                  fontSize: '2rem', cursor: rated ? 'default' : 'pointer',
                  color: s <= (hover || Math.round(movie.rating)) ? '#f5c518' : '#2a2a3a',
                  transition: 'color 0.15s',
                }}
              >★</span>
            ))}
          </div>
        </div>

        {/* CDN URL */}
        <div style={styles.urlBox}>
          <span style={styles.urlLabel}>📡 CloudFront CDN URL</span>
          <code style={styles.url}>{movie.video_url}</code>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 4rem' },
  loading: { textAlign: 'center', padding: '5rem', color: '#8888aa' },
  playerWrap: { borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '1.5rem' },
  player: { width: '100%', maxHeight: '540px', display: 'block' },
  content: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  categoryBadge: { background: '#e50914', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 3rem)', letterSpacing: '0.04em', marginTop: '0.4rem' },
  meta: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8888aa', fontSize: '0.9rem', marginTop: '0.3rem' },
  views: {}, ratingText: {}, sep: {},
  deleteBtn: { padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e50914', background: 'transparent', color: '#e50914', cursor: 'pointer', whiteSpace: 'nowrap' },
  desc: { color: '#aaaacc', lineHeight: 1.7, fontSize: '0.95rem', background: '#13131a', padding: '1rem', borderRadius: '8px' },
  ratingBox: { background: '#1c1c27', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '1.25rem' },
  rateLabel: { color: '#8888aa', marginBottom: '0.75rem', fontSize: '0.9rem' },
  stars: { display: 'flex', gap: '0.25rem' },
  urlBox: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '1rem' },
  urlLabel: { color: '#8888aa', fontSize: '0.8rem', marginBottom: '0.4rem', display: 'block' },
  url: { color: '#e50914', fontSize: '0.8rem', wordBreak: 'break-all' },
};
