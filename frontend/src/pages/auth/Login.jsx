import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, Loader2, Palette, Zap, Pizza } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Enter a valid email address';
    if (!password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    setAuthError('');
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data.token, data.user);
      toast.success('Welcome back!');
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Pizza size={36} aria-hidden="true" /></span>
          <span className="auth-brand-name">Pizzara</span>
        </div>

        <h1 className="auth-left-heading">
          Custom Pizza,<br />Delivered Fresh.
        </h1>

        <p className="auth-left-sub">
          Build your perfect pizza from scratch, choose from our
          chef's specials, and track your order in real time.
        </p>

        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><Palette size={18} aria-hidden="true" /></div>
            <div className="auth-feature-text">
              <strong>Build Your Pizza</strong>
              <span>Choose every layer — base, sauce, cheese & toppings.</span>
            </div>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><Zap size={18} aria-hidden="true" /></div>
            <div className="auth-feature-text">
              <strong>Live Order Tracking</strong>
              <span>Watch your order move from kitchen to doorstep.</span>
            </div>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><Pizza size={18} aria-hidden="true" /></div>
            <div className="auth-feature-text">
              <strong>Chef's Specials</strong>
              <span>Handcrafted recipes ready to order in one click.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-compact-brand" aria-label="Pizzara">
          <span className="auth-brand-icon"><Pizza size={28} aria-hidden="true" /></span>
          <span className="auth-brand-name">Pizzara</span>
        </div>
        <div className="auth-card">
          <h2 className="auth-card-title">Login</h2>
          <p className="auth-card-sub">Enter your credentials to access your account.</p>

          {authError && (
            <div className="auth-message error" role="alert">{authError}</div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@email.com"
                value={email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
                required
              />
              {errors.email && <small className="form-error" id="login-email-error" role="alert">{errors.email}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                  required
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <small className="form-error" id="login-password-error" role="alert">{errors.password}</small>}
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="auth-spinner" size={17} aria-hidden="true" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;