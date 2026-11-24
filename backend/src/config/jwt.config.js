const jwt = require('jsonwebtoken');
const generateTokens = (parentId) => ({
  accessToken: jwt.sign({ parentId, type: 'access' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }),
  refreshToken: jwt.sign({ parentId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});
const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
module.exports = { generateTokens, verifyAccess, verifyRefresh };
