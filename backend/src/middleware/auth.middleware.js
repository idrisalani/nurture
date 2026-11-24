const { verifyAccess } = require('../config/jwt.config');
const { getCache } = require('../config/redis.config');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    // Check if token is blacklisted (logout)
    const blacklisted = await getCache(`blacklist:${token}`);
    if (blacklisted) return res.status(401).json({ error: 'Token revoked' });
    const decoded = verifyAccess(token);
    req.parentId = decoded.parentId;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
