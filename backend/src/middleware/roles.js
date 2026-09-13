/**
 * Role-hierarchy authorization middleware. Must run AFTER the `protect` auth
 * middleware so `req.user` is already populated from the verified JWT /
 * database lookup — the client can never influence this via request body,
 * query params, or headers.
 *
 * The four admin-panel roles form a genuinely LINEAR hierarchy: each tier's
 * allowed actions are a strict superset of the tier below it (moderator ⊂
 * admin_assistant ⊂ admin). Because of that, permission checks are always a
 * single numeric "is the caller's level >= this endpoint's minimum level"
 * comparison — there should never be a need for a per-endpoint role-name
 * allowlist alongside this, which is exactly the kind of thing that's easy
 * to get wrong or leave a gap in.
 */
const ROLE_LEVELS = { user: 0, moderator: 1, admin_assistant: 2, admin: 3 };

/**
 * Returns middleware requiring the authenticated user's role to be at least
 * `minLevel` on the ROLE_LEVELS scale. Must run after `protect`.
 *
 * @param {number} minLevel
 * @returns {import('express').RequestHandler}
 */
const requireRoleLevel = (minLevel) => (req, res, next) => {
  const level = ROLE_LEVELS[req.user?.role] ?? -1;
  if (level < minLevel) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  return next();
};

module.exports = {
  ROLE_LEVELS,
  isModerator: requireRoleLevel(ROLE_LEVELS.moderator), // moderator, admin_assistant, or admin
  isManager: requireRoleLevel(ROLE_LEVELS.admin_assistant), // admin_assistant or admin
  isAdmin: requireRoleLevel(ROLE_LEVELS.admin), // admin only
};
