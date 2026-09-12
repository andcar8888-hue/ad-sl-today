import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

// Client-side gating only — this hides the admin route/nav link for
// non-admins in the UI. The backend independently and authoritatively
// verifies the admin role on every admin-only endpoint.
export default function AdminRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
