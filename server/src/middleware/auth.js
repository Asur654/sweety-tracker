const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Authentication middleware: verifies Bearer token and attaches req.user
 */
async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'Not authorized, user no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Not authorized, token invalid or expired'
    });
  }
}

module.exports = { protect };
