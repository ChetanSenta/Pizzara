import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ id, error, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div className="password-field">
        <input
          {...inputProps}
          id={id}
          className="form-input"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : inputProps['aria-describedby']}
          required
        />
        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error && <small id={`${id}-error`} className="form-error" role="alert">{error}</small>}
    </>
  );
}
