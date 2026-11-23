import { Link } from 'react-router-dom';

const NotFound = () => (
  <main className="page container" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
    <div>
      <div style={{ fontSize: 'var(--fs-illustration)', marginBottom: 12 }}>🍕</div>
      <h1>404 — Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>This slice seems to be missing.</p>
      <Link className="btn btn-primary" to="/">Back to Pizzara</Link>
    </div>
  </main>
);

export default NotFound;
