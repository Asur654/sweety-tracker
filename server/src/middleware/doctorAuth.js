/**
 * Middleware to restrict access to doctor accounts only
 */
function requireDoctor(req, res, next) {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      error: 'Access denied. Doctor account required.'
    });
  }
  next();
}

module.exports = { requireDoctor };
