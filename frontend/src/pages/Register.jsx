import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(Object.fromEntries(getFieldErrors(err).map((fe) => [fe.field, fe.message])));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Create an Account</h1>
        <p className="mt-1 text-sm text-gray-500">Join AD SL Today to post ads and save favourites.</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="field-label">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.name)}
            className={`input-field ${fieldErrors.name ? 'input-field-error' : ''}`}
          />
          {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
            className={`input-field ${fieldErrors.email ? 'input-field-error' : ''}`}
          />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.password)}
            className={`input-field ${fieldErrors.password ? 'input-field-error' : ''}`}
          />
          <p className="field-hint">At least 6 characters.</p>
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
