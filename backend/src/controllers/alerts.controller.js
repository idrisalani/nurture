const Alert = require('../models/Alert.model');
const { sequelize } = require('../config/db.config');

exports.getAlerts = async (req, res) => {
  const { unread_only, limit = 50 } = req.query;
  const where = { parent_id: req.parentId };
  if (unread_only === 'true') where.is_read = false;
  const alerts = await Alert.findAll({ where, order: [['created_at', 'DESC']], limit: parseInt(limit) });
  res.json(alerts);
};

exports.markRead = async (req, res) => {
  await Alert.update({ is_read: true, read_at: new Date() }, { where: { id: req.params.id, parent_id: req.parentId } });
  res.json({ message: 'Marked as read' });
};

exports.markAllRead = async (req, res) => {
  await Alert.update({ is_read: true, read_at: new Date() }, { where: { parent_id: req.parentId, is_read: false } });
  res.json({ message: 'All alerts marked as read' });
};

exports.getPreferences = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM alert_preferences WHERE parent_id=$1', { bind: [req.parentId] });
  res.json(rows[0] || { push_enabled: true, sms_enabled: false });
};

exports.updatePreferences = async (req, res) => {
  await sequelize.query(
    `INSERT INTO alert_preferences (parent_id, push_enabled, sms_enabled, quiet_hours_enabled, quiet_start, quiet_end)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (parent_id) DO UPDATE SET push_enabled=$2, sms_enabled=$3, quiet_hours_enabled=$4, quiet_start=$5, quiet_end=$6`,
    { bind: [req.parentId, req.body.push_enabled, req.body.sms_enabled, req.body.quiet_hours_enabled, req.body.quiet_start, req.body.quiet_end] }
  );
  res.json({ message: 'Preferences saved' });
};
