import React from 'react';
import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const stars = '★'.repeat(Math.round(movie.rating || 0)) + '☆'.repeat(5 - Math.round(movie.rating || 0));

  return (
    <Link to={`/movie/${movie.id}`} style={styles.card}>
      <div style={styles.thumb}>
        {movie.thumbnail
          ? <img src={movie.thumbnail} alt={movie.title} style={styles.img} />
          : <div style={styles.placeholder}>🎬</div>}
        <span style={styles.category}>{movie.category}</span>
      </div>
      <div style={styles.info}>
        <h3 style={styles.title}>{movie.title}</h3>
        <div style={styles.meta}>
          <span style={styles.stars}>{stars}</span>
          <span style={styles.rating}>{movie.rating?.toFixed(1) || '—'}</span>
          <span style={styles.views}>👁 {movie.views || 0}</span>
        </div>
        {movie.description && (
          <p style={styles.desc}>{movie.description.slice(0, 80)}{movie.description.length > 80 ? '…' : ''}</p>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex', flexDirection: 'column', borderRadius: '10px',
    background: '#1c1c27', border: '1px solid #2a2a3a', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s', textDecoration: 'none',
    cursor: 'pointer',
    ':hover': { transform: 'translateY(-4px)' },
  },
  thumb: { position: 'relative', paddingTop: '56.25%', background: '#13131a' },
  img: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' },
  category: {
    position: 'absolute', top: 8, right: 8,
    background: '#e50914', color: '#fff', fontSize: '0.72rem',
    fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em',
  },
  info: { padding: '0.85rem' },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '0.04em', marginBottom: '0.4rem', color: '#f0f0f5' },
  meta: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' },
  stars: { color: '#f5c518', fontSize: '0.8rem' },
  rating: { color: '#f5c518', fontSize: '0.85rem', fontWeight: 600 },
  views: { color: '#8888aa', fontSize: '0.8rem', marginLeft: 'auto' },
  desc: { color: '#8888aa', fontSize: '0.82rem', lineHeight: 1.4 },
};
