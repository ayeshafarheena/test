import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🎬 CINESTREAM</Link>
      <form onSubmit={search} style={styles.form}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search movies..."
          style={styles.input}
        />
        <button type="submit" style={styles.btn}>Search</button>
      </form>
      <Link to="/upload" style={styles.upload}>+ Upload</Link>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', gap: '1.5rem',
    padding: '0 2rem', height: '64px',
    background: 'linear-gradient(90deg, #0a0a0f 60%, #13131a)',
    borderBottom: '1px solid #2a2a3a', position: 'sticky', top: 0, zIndex: 100,
  },
  brand: {
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem',
    letterSpacing: '0.05em', color: '#e50914', whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  form: { display: 'flex', flex: 1, gap: '0.5rem', maxWidth: '480px' },
  input: {
    flex: 1, padding: '0.5rem 1rem', borderRadius: '6px',
    border: '1px solid #2a2a3a', background: '#1c1c27', color: '#f0f0f5',
    fontSize: '0.95rem', outline: 'none',
  },
  btn: {
    padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none',
    background: '#e50914', color: '#fff', fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer',
  },
  upload: {
    padding: '0.5rem 1.2rem', borderRadius: '6px',
    background: 'transparent', border: '1px solid #e50914',
    color: '#e50914', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
};
