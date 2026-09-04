import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-header">
            <p className="eyebrow">Welcome to</p>
            <h2>AssetFlow</h2>
            <p className="auth-copy">Enterprise Asset &amp; Resource Management to streamline lifecycle, optimize resources, and boost efficiency.</p>
          </div>

          <div className="features">
            <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:'rgba(123,91,255,0.14)',display:'grid',placeItems:'center'}}>📦</div>
              <div>
                <strong>Manage Assets</strong>
                <div style={{color:'var(--muted)'}}>Track and manage all your assets in one place</div>
              </div>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:'rgba(123,91,255,0.10)',display:'grid',placeItems:'center'}}>👥</div>
              <div>
                <strong>Allocate Resources</strong>
                <div style={{color:'var(--muted)'}}>Efficiently allocate assets to teams</div>
              </div>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <div style={{width:36,height:36,borderRadius:10,background:'rgba(123,91,255,0.08)',display:'grid',placeItems:'center'}}>📊</div>
              <div>
                <strong>Real-time Insights</strong>
                <div style={{color:'var(--muted)'}}>Make data-driven decisions with powerful analytics</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-wrap">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Signing in...' : 'Log In'}
            </button>

            <p className="auth-footer">
              <small>New to AssetFlow? <Link to="/signup">Create an account</Link></small>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}