import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

const ForgotPassword = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent if account exists');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-single">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><KeyRound size={32} aria-hidden="true" /></div>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <>
            <div className="auth-message success">
              If an account exists with <strong>{email}</strong>, a password reset link has been sent.
            </div>
            <div className="auth-links"><Link to="/login">Back to Login</Link></div>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {authError && <div className="auth-message error" role="alert">{authError}</div>}
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <input id="forgot-email" type="email" autoComplete="email" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "forgot-email-error" : undefined} className="form-input" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); setAuthError(''); }}
                onInvalid={(e) => setEmailError(e.currentTarget.validationMessage)} required />
              {emailError && <small id="forgot-email-error" className="form-error" role="alert">{emailError}</small>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} aria-busy={loading}>
              {loading ? <><Loader2 className="auth-spinner" size={17} aria-hidden="true" /> Sending...</> : 'Send Reset Link'}
            </button>
            <div className="auth-links" style={{ marginTop: 16 }}><Link to="/login">Back to Login</Link></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
