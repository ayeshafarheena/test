import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMovies, getCategories } from '../utils/api';
import MovieCard from '../components/MovieCard';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);

  const search   = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    getMovies({ search, category, page, limit: 12 })
      .then(r => { setMovies(r.data.movies); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [search, category, page]);

  const setFilter = (key, val) => {
    setPage(1);
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎬 CINESTREAM</h1>
        <p style={styles.heroSub}>Upload, discover & stream movies — powered by S3 + CloudFront</p>
      </div>

      {/* Category Pills */}
      <div style={styles.pills}>
        <button style={pill(category === '')} onClick={() => setFilter('category', '')}>All</button>
        {categories.map(c => (
          <button key={c} style={pill(category === c)} onClick={() => setFilter('category', c)}>{c}</button>
        ))}
      </div>

      {/* Search tag */}
      {search && (
        <div style={styles.searchTag}>
          Results for: <strong>"{search}"</strong>
          <button onClick={() => setFilter('search', '')} style={styles.clear}>✕</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={styles.loading}>Loading movies…</div>
      ) : movies.length === 0 ? (
        <div style={styles.empty}>No movies found. <a href="/upload" style={{ color: '#e50914' }}>Upload one!</a></div>
      ) : (
        <div style={styles.grid}>
          {movies.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div style={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={styles.pgBtn}>← Prev</button>
          <span style={{ color: '#8888aa' }}>Page {page} of {Math.ceil(total / 12)}</span>
          <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)} style={styles.pgBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}

const pill = (active) => ({
  padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
  background: active ? '#e50914' : '#1c1c27', color: active ? '#fff' : '#8888aa',
  fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
  border: active ? 'none' : '1px solid #2a2a3a',
});

const styles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 4rem' },
  hero: { textAlign: 'center', padding: '4rem 0 2rem' },
  heroTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#e50914', letterSpacing: '0.08em' },
  heroSub: { color: '#8888aa', marginTop: '0.5rem', fontSize: '1rem' },
  pills: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' },
  searchTag: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f0f0f5' },
  clear: { background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', fontSize: '1rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#8888aa', fontSize: '1.1rem' },
  empty: { textAlign: 'center', padding: '4rem', color: '#8888aa', fontSize: '1.1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' },
  pgBtn: {
    padding: '0.5rem 1.2rem', borderRadius: '6px', border: '1px solid #2a2a3a',
    background: '#1c1c27', color: '#f0f0f5', cursor: 'pointer',
    ':disabled': { opacity: 0.4 },
  },
};
