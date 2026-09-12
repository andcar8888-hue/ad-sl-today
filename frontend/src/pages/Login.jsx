import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
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
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
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
        <h1 className="text-xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Login to manage your ads and favourites.</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.password)}
            className={`input-field ${fieldErrors.password ? 'input-field-error' : ''}`}
          />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
