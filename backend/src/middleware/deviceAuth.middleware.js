const { sequelize } = require('../config/db.config');

// Middleware for child device endpoints — validates device token
const deviceAuth = async (req, res, next) => {
  const { device_id, child_id } = req.headers;
  if (!device_id || !child_id) return res.status(401).json({ error: 'Device credentials required' });
  const [rows] = await sequelize.query(
    "SELECT id, status FROM devices WHERE id = $1 AND child_id = $2 AND status = 'active'",
    { bind: [device_id, child_id] }
  );
  if (!rows.length) return res.status(401).json({ error: 'Device not authorized' });
  req.deviceId = device_id;
  req.childId = child_id;
  next();
};

module.exports = deviceAuth;
