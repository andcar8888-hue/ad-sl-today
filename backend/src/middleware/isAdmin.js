/**
 * Admin authorization middleware. Must run AFTER the `protect` auth
 * middleware so `req.user` is already populated from the verified JWT /
 * database lookup — the client can never influence this via request body,
 * query params, or headers.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }
  return next();
};

module.exports = isAdmin;
