import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAds, fetchMyAdsStats, deleteAd } from '../api/ads';
import { updateProfile, changePassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../utils/errors';

// Shown for an ad still awaiting payment confirmation, so the owner can get
// back to the bank details + user code without digging through WhatsApp history.
// Ported verbatim from the now-retired MyAds.jsx.
function needsCheckoutLink(ad) {
  return ad.status === 'pending_payment' && ad.orderStatus !== 'confirmed';
}

// Small pill shown alongside StatusBadge (which still correctly reflects the
// ad's real, unchanged status) when the owner has a content edit awaiting
// admin review — purely informational, a DERIVED label, never a replacement
// for StatusBadge. Ported verbatim from the now-retired MyAds.jsx.
function PendingEditBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
        />
      </svg>
      Pending Edit Approval
    </span>
  );
}

// The user code, in the same bold monospace treatment Checkout.jsx uses —
// ported verbatim from the now-retired MyAds.jsx.
function UserCode({ ad }) {
  if (!ad.userCode) {
    return <span className="font-mono text-sm text-gray-500">—</span>;
  }
  return (
    <span className="font-mono text-base font-extrabold tracking-wide text-primary">
      {ad.userCode}
    </span>
  );
}

// --- Small icons for the Overview stat cards -------------------------------
// Eye/heart glyphs are copied verbatim from AdCard.jsx (path data unchanged)
// so "views" and "likes" read as the exact same visual language wherever
// they show up in the app, not a subtly different reinterpretation here.
function EyeIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z"
      />
    </svg>
  );
}

// No equivalent "an ad/listing" glyph exists elsewhere in the app yet, so
// this one is new — a plain tag icon (classifieds = tagged items), kept to
// the same stroke-only, rounded-cap style as the icons above.
function TagIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.169.659 1.591l9.581 9.581c.699.699 1.83.699 2.53 0l7.026-7.026c.699-.699.699-1.83 0-2.53L13.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

// Clock glyph for "Ads Pending Approval" — pairs with the shared warning
// accent below since this count is actionable (something sitting in a
// queue), unlike the other three neutral, purely-informational counts.
function ClockIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 1.75" />
    </svg>
  );
}

// Small lock glyph used purely to flag the Change Password section heading
// as a more "sensitive" action than the plain Account Settings form above it.
function LockIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="9" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5V7a4 4 0 018 0v3.5" />
    </svg>
  );
}

// Overview stat card — bold number + icon chip. `accent` flags the one card
// (Ads Pending Approval) that's actionable/attention-worthy rather than a
// neutral informational count, so it gets the shared --color-warning
// treatment (same amber accent CategoriesTab.jsx uses for its "category
// needs reassignment" prompt) instead of the plain primary-tinted chip.
function StatCard({ label, value, icon, accent = false }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3.5 sm:p-4 ${
        accent ? 'border-warning/50 bg-amber-50' : 'border-border bg-surface'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          accent ? 'bg-warning text-ink' : 'bg-primary/10 text-primary-dark'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-2xl font-extrabold leading-tight sm:text-3xl ${accent ? 'text-amber-900' : 'text-ink'}`}>
          {value}
        </p>
        <p className="text-xs font-medium leading-snug text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// Shared visual shell for each of the 4 dashboard sections — one bordered
// panel with a divider under the heading, so the sections read as distinct
// units on this single long scrolling page without stacking into 4 heavy,
// separately-boxed panels (Overview's stat cards and the My Ads list cards
// already carry their own internal borders, so the outer shell stays plain).
function Section({ title, description, action, icon, children }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink">
            {icon}
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();

  // --- Overview stats -------------------------------------------------------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // --- My Ads list ------------------------------------------------------------
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsError, setAdsError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // --- Account Settings ---------------------------------------------------
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsappNumber: user?.whatsappNumber || '',
    telegramUsername: user?.telegramUsername || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // --- Change Password ------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const data = await fetchMyAdsStats();
      setStats(data);
    } catch (err) {
      setStatsError(getErrorMessage(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadAds = useCallback(async () => {
    setAdsLoading(true);
    setAdsError('');
    try {
      const data = await fetchMyAds();
      setAds(data.ads || []);
    } catch (err) {
      setAdsError(getErrorMessage(err));
    } finally {
      setAdsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAds();
  }, [loadStats, loadAds]);

  const handleDeleteAd = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}"? This cannot be undone.`)) return;
    setDeletingId(ad._id);
    setAdsError('');
    try {
      await deleteAd(ad._id);
      await Promise.all([loadAds(), loadStats()]);
    } catch (err) {
      setAdsError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const updateProfileField = (name, value) => {
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  // Only sends fields that actually changed — same diff-and-send pattern
  // AdsTab.jsx's inline edit panel uses.
  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const payload = {};
      if (profileForm.name.trim() !== (user?.name || '')) payload.name = profileForm.name.trim();
      if (profileForm.phone.trim() !== (user?.phone || '')) payload.phone = profileForm.phone.trim();
      if (profileForm.whatsappNumber.trim() !== (user?.whatsappNumber || '')) {
        payload.whatsappNumber = profileForm.whatsappNumber.trim();
      }
      if (profileForm.telegramUsername.trim() !== (user?.telegramUsername || '')) {
        payload.telegramUsername = profileForm.telegramUsername.trim();
      }

      if (Object.keys(payload).length > 0) {
        const data = await updateProfile(payload);
        refreshUser(data.user);
      }
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const updatePasswordField = (name, value) => {
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Client-side check first — don't bother the server with a mismatch.
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New Password and Confirm New Password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">My Dashboard</h1>
        <p className="text-sm text-gray-500">ඔබගේ දැන්වීම් සහ ගිණුම මෙතැනින් කළමනාකරණය කරන්න.</p>
      </div>

      {/* --- Overview cards --------------------------------------------------- */}
      <Section title="Overview">
        {statsError && <Alert variant="error">{statsError}</Alert>}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Ads" value={stats.totalAds} icon={<TagIcon className="h-5 w-5" />} />
              <StatCard label="Total Views" value={stats.totalViews} icon={<EyeIcon className="h-5 w-5" />} />
              <StatCard label="Total Likes" value={stats.totalLikes} icon={<HeartIcon className="h-5 w-5" />} />
              <StatCard
                label="Ads Pending Approval"
                value={stats.pendingApprovalCount}
                icon={<ClockIcon className="h-5 w-5" />}
                accent
              />
            </div>
          )
        )}
      </Section>

      {/* --- My Ads list -------------------------------------------------------- */}
      <Section
        title="My Ads"
        action={
          <Link to="/post-ad" className="btn-primary btn-sm">
            Post an Ad
          </Link>
        }
      >
        {adsError && <Alert variant="error">{adsError}</Alert>}

        {adsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-500">
            <p>You haven&apos;t posted any ads yet.</p>
            <Link to="/post-ad" className="btn-primary mt-2">
              Post an Ad
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const thumbnail = ad.images?.[0] ? resolveImageUrl(ad.images[0]) : null;
              return (
                <div
                  key={ad._id}
                  className="flex gap-3 rounded-lg border border-border bg-surface p-3 transition hover:shadow-sm sm:p-4"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:h-20 sm:w-20">
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-center text-[10px] text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-ink">{ad.title}</h3>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={ad.status} />
                        {ad.hasPendingEdit && <PendingEditBadge />}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {ad.category?.name || 'Uncategorized'}
                      {ad.city ? ` · ${ad.city}` : ''} · {formatRelativeTime(ad.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      User code: <UserCode ad={ad} /> · Views: {ad.views || 0} · Likes: {ad.likes || 0}
                    </p>
                    {/* Complete Payment / Edit are grouped together (related,
                        non-destructive actions); Delete is pushed to the far
                        side and separated by the divider above so it never
                        reads as just another button in the same row. */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                      <div className="flex flex-wrap gap-2">
                        {needsCheckoutLink(ad) && (
                          <Link to={`/checkout/${ad._id}`} className="btn-outline btn-sm inline-flex">
                            Complete Payment
                          </Link>
                        )}
                        <Link to={`/my-ads/${ad._id}/edit`} className="btn-secondary btn-sm inline-flex">
                          Edit
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad)}
                        disabled={deletingId === ad._id}
                        className="btn-danger btn-sm inline-flex"
                      >
                        {deletingId === ad._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* --- Account Settings --------------------------------------------------- */}
      <Section
        title="Account Settings"
        description="Keep your contact details up to date so buyers can reach you."
      >
        <div className="max-w-lg space-y-3">
          {profileError && <Alert variant="error">{profileError}</Alert>}
          {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="profile-email">
                Email
              </label>
              {/* Read-only for context — email is never part of this form's
                  payload. Relies on .input-field's own disabled styling
                  (muted background + grey text) rather than a redundant
                  opacity fade on top of it, plus the hint below, so this
                  reads as "intentionally locked", not a broken field. */}
              <input id="profile-email" value={user?.email || ''} disabled className="input-field" />
              <p className="field-hint">Your email is used to sign in and can&apos;t be changed here.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                value={profileForm.name}
                onChange={(event) => updateProfileField('name', event.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="profile-phone">
                Phone
              </label>
              <input
                id="profile-phone"
                value={profileForm.phone}
                onChange={(event) => updateProfileField('phone', event.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="profile-whatsapp">
                WhatsApp Number
              </label>
              <input
                id="profile-whatsapp"
                value={profileForm.whatsappNumber}
                onChange={(event) => updateProfileField('whatsappNumber', event.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="profile-telegram">
                Telegram Username
              </label>
              <input
                id="profile-telegram"
                value={profileForm.telegramUsername}
                onChange={(event) => updateProfileField('telegramUsername', event.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={profileSaving} className="btn-primary">
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </Section>

      {/* --- Change Password ------------------------------------------------------ */}
      <Section
        title="Change Password"
        icon={<LockIcon className="h-4 w-4 text-gray-400" />}
        description="For your security, choose a password you haven't used before."
      >
        <div className="max-w-lg space-y-3">
          {passwordError && <Alert variant="error">{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="password-current">
                Current Password
              </label>
              <input
                id="password-current"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password-new">
                New Password
              </label>
              <input
                id="password-new"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                className="input-field"
              />
              <p className="field-hint">Must be at least 6 characters.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="password-confirm">
                Confirm New Password
              </label>
              <input
                id="password-confirm"
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(event) => updatePasswordField('confirmNewPassword', event.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={passwordSaving} className="btn-primary">
              {passwordSaving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      </Section>
    </div>
  );
}
