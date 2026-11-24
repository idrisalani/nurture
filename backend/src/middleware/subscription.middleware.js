const { sequelize } = require('../config/db.config');

// Require at least 'basic' plan
exports.requireBasic = async (req, res, next) => {
  const [rows] = await sequelize.query(
    'SELECT subscription_plan FROM parents WHERE id = $1', { bind: [req.parentId] }
  );
  if (!rows.length) return res.status(404).json({ error: 'Parent not found' });
  if (rows[0].subscription_plan === 'free') {
    return res.status(403).json({ error: 'Upgrade to Basic plan to access this feature', upgrade_url: '/subscription' });
  }
  req.parentPlan = rows[0].subscription_plan;
  next();
};

// Require 'pro' plan
exports.requirePro = async (req, res, next) => {
  const [rows] = await sequelize.query(
    'SELECT subscription_plan FROM parents WHERE id = $1', { bind: [req.parentId] }
  );
  if (!rows.length) return res.status(404).json({ error: 'Parent not found' });
  if (rows[0].subscription_plan !== 'pro') {
    return res.status(403).json({ error: 'Upgrade to Pro plan to access this feature', upgrade_url: '/subscription' });
  }
  req.parentPlan = 'pro';
  next();
};
