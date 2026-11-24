const Child = require('../models/Child.model');
const { sequelize } = require('../config/db.config');

exports.getChildren = async (req, res) => {
  const children = await Child.findAll({ where: { parent_id: req.parentId, is_active: true } });
  res.json(children);
};

exports.addChild = async (req, res) => {
  try {
    const { full_name, date_of_birth, avatar_emoji } = req.body;
    const child = await Child.create({ parent_id: req.parentId, full_name, date_of_birth, avatar_emoji });
    // Create default screen limits for the child
    await sequelize.query(
      'INSERT INTO screen_limits (child_id) VALUES ($1) ON CONFLICT DO NOTHING',
      { bind: [child.id] }
    );
    res.status(201).json(child);
  } catch (err) {
    if (err.message?.includes('Child limit')) return res.status(403).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

exports.updateChild = async (req, res) => {
  const [updated] = await Child.update(req.body, { where: { id: req.params.id, parent_id: req.parentId } });
  if (!updated) return res.status(404).json({ error: 'Child not found' });
  res.json({ message: 'Child updated' });
};

exports.deleteChild = async (req, res) => {
  await Child.update({ is_active: false }, { where: { id: req.params.id, parent_id: req.parentId } });
  res.json({ message: 'Child removed' });
};

exports.getChildSummary = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT c.*, 
     COALESCE(su.today_mins, 0) as today_mins_used,
     sl.weekday_limit_mins,
     l.latitude as last_lat, l.longitude as last_lng, l.recorded_at as last_seen
     FROM children c
     LEFT JOIN screen_limits sl ON sl.child_id = c.id
     LEFT JOIN (SELECT child_id, SUM(minutes_used) as today_mins FROM screen_usage WHERE usage_date = CURRENT_DATE GROUP BY child_id) su ON su.child_id = c.id
     LEFT JOIN LATERAL (SELECT latitude, longitude, recorded_at FROM location_pings WHERE child_id = c.id ORDER BY recorded_at DESC LIMIT 1) l ON true
     WHERE c.id = $1 AND c.parent_id = $2`,
    { bind: [req.params.id, req.parentId] }
  );
  if (!rows.length) return res.status(404).json({ error: 'Child not found' });
  res.json(rows[0]);
};

const crypto = require('crypto');
// Parent asks for a 6-digit code to type into the child's phone. Valid for 15 minutes, single use.
exports.createPairingCode = async (req, res) => {
  const [kids] = await sequelize.query('SELECT id FROM children WHERE id=$1 AND parent_id=$2 AND is_active=true', { bind: [req.params.id, req.parentId] });
  if (!kids.length) return res.status(404).json({ error: 'Child not found' });
  await sequelize.query('UPDATE device_pairing_codes SET used_at=NOW() WHERE child_id=$1 AND used_at IS NULL', { bind: [req.params.id] });
  for (let i = 0; i < 5; i++) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    try {
      const [rows] = await sequelize.query(
        `INSERT INTO device_pairing_codes (child_id, parent_id, code, expires_at) VALUES ($1,$2,$3, NOW() + INTERVAL '15 minutes') RETURNING code, expires_at`,
        { bind: [req.params.id, req.parentId, code] });
      return res.status(201).json(rows[0]);
    } catch (e) { if (!/uq_pairing_live_code|unique/i.test(e.message)) throw e; }
  }
  res.status(500).json({ error: 'Could not create a code. Try again.' });
};
exports.getDevices = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT d.id, d.device_name, d.device_model, d.platform, d.status, d.last_seen_at FROM devices d JOIN children c ON c.id=d.child_id
     WHERE c.id=$1 AND c.parent_id=$2 AND d.status IN ('active','pending') ORDER BY d.created_at`, { bind: [req.params.id, req.parentId] });
  res.json(rows);
};
