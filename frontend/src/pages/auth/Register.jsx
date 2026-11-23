import { useState } from 'react';
import { Loader2, Palette, Pizza, Zap } from 'lucide-react';
import PasswordField from './PasswordField';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

const Register = () => {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = ({ target }) => {
    setForm({ ...form, [target.name]: target.value });
    setErrors((current) => ({ ...current, [target.name]: '', confirmPassword: '' }));
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(form.password)) {
      setErrors({ password: 'Use 8+ characters with uppercase, lowercase, and a number' });
      return;
    }
    setErrors({});
    setAuthError('');
    setLoading(true);
    try {
      const { data } = await registerUser({ name: form.name, email: form.email, password: form.password });
      if (data.token) {
        login(data.token, data.user);
        toast.success('Account created!');
        navigate('/dashboard');
      } else {
        toast.success('Account created! Please verify your email.');
        navigate('/login');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
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
          Join Pizzara<br />Today.
        </h1>

        <p className="auth-left-sub">
          Create your account and start building your dream pizza.
          Fresh ingredients, endless combinations, fast delivery.
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
        <Link className="auth-compact-brand" to="/">
          <Pizza className="auth-brand-icon" size={28} aria-hidden="true" />
          <span className="auth-brand-name">Pizzara</span>
        </Link>
        <div className="auth-card">
          <h2 className="auth-card-title">Create Account</h2>
          <p className="auth-card-sub">Sign up to start ordering your perfect pizza.</p>

          {authError && <div className="auth-message error" role="alert">{authError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                onInvalid={(event) => { const message = event.target.validationMessage; setErrors((current) => ({ ...current, name: message })); }}
                type="text"
                className="form-input"
                placeholder="Vivek Sangani"
                value={form.name}
                onChange={handleChange}
                required
              />
              {errors.name && <small className="form-error" id="name-error" role="alert">{errors.name}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                onInvalid={(event) => { const message = event.target.validationMessage; setErrors((current) => ({ ...current, email: message })); }}
                type="email"
                className="form-input"
                placeholder="name@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <small className="form-error" id="email-error" role="alert">{errors.email}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <PasswordField
                id="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                error={errors.password}
                onChange={handleChange}
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 6 }}>
                Use 8+ characters with uppercase, lowercase, and a number.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <><Loader2 className="auth-spinner" size={17} aria-hidden="true" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="auth-links">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;