import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

// Client-side gating only — this hides the admin route/nav link for
// non-admin-panel users in the UI. The backend independently and
// authoritatively verifies the actual required role level on every
// admin-only endpoint. Gated on `isModerator` (moderator-tier or above) so
// moderators/admin_assistants can enter `/admin` at all — individual tabs
// and actions inside further self-restrict based on the viewer's exact role.
export default function AdminRoute() {
  const { isModerator, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!isModerator) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
