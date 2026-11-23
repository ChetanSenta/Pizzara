import { useState } from 'react';
import { CircleCheck, Loader2, LockKeyhole } from 'lucide-react';
import PasswordField from './PasswordField';
import { useParams, Link } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

const ResetPassword = () => {
  const toast = useToast();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setErrors({ confirmPassword: 'Passwords do not match' });
    if (password.length < 6) return setErrors({ password: 'Password must be at least 6 characters' });
    setErrors({});
    setAuthError('');
    setLoading(true);
    try {
      const { data } = await resetPassword(token, { password });
      toast.success(data.message);
      setSuccess(true);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page auth-page-single">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><CircleCheck size={32} aria-hidden="true" /></div>
            <h1>Password Reset!</h1>
          </div>
          <div className="auth-message success">Your password has been reset successfully.</div>
          <div className="auth-links"><Link to="/login">Go to Login</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page-single">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><LockKeyhole size={32} aria-hidden="true" /></div>
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {authError && <div className="auth-message error" role="alert">{authError}</div>}
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <PasswordField id="new-password" placeholder="Min 6 characters" value={password} error={errors.password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}); setAuthError(''); }} />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-new-password">Confirm Password</label>
            <PasswordField id="confirm-new-password" placeholder="Re-enter password" value={confirmPassword} error={errors.confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); setAuthError(''); }} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} aria-busy={loading}>
            {loading ? <><Loader2 className="auth-spinner" size={17} aria-hidden="true" /> Resetting...</> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
