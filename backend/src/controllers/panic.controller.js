const panicSvc = require('../services/panic.service');
const { sequelize } = require('../config/db.config');

exports.triggerPanic = async (req, res) => {
  const { latitude, longitude, accuracy_metres } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'Location required for panic alert' });
  await panicSvc.trigger(req.childId, { latitude, longitude, accuracy_metres });
  res.json({ message: 'SOS alert sent to all emergency contacts' });
};

exports.getContacts = async (req, res) => {
  const [rows] = await sequelize.query(
    'SELECT * FROM emergency_contacts WHERE parent_id = $1 ORDER BY created_at',
    { bind: [req.parentId] }
  );
  res.json(rows);
};

exports.addContact = async (req, res) => {
  const { name, phone, relationship } = req.body;
  const [rows] = await sequelize.query(
    'INSERT INTO emergency_contacts (parent_id, name, phone, relationship) VALUES ($1,$2,$3,$4) RETURNING *',
    { bind: [req.parentId, name, phone, relationship] }
  );
  res.status(201).json(rows[0]);
};

exports.removeContact = async (req, res) => {
  await sequelize.query('DELETE FROM emergency_contacts WHERE id=$1 AND parent_id=$2', { bind: [req.params.id, req.parentId] });
  res.json({ message: 'Contact removed' });
};

exports.getPanicHistory = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT pl.*, c.full_name as child_name 
     FROM panic_logs pl JOIN children c ON c.id = pl.child_id
     WHERE c.parent_id = $1 ORDER BY pl.triggered_at DESC LIMIT 20`,
    { bind: [req.parentId] }
  );
  res.json(rows);
};

// Parent raises SOS from the parent app. Uses the coordinates sent, else the child's last known location.
exports.triggerPanicAsParent = async (req, res) => {
  const { child_id } = req.body;
  let { latitude, longitude } = req.body;
  const [kids] = await sequelize.query('SELECT id FROM children WHERE id=$1 AND parent_id=$2 AND is_active=true', { bind: [child_id, req.parentId] });
  if (!kids.length) return res.status(404).json({ error: 'Child not found' });
  if (latitude == null || longitude == null) {
    const [pings] = await sequelize.query('SELECT latitude, longitude FROM location_pings WHERE child_id=$1 ORDER BY recorded_at DESC LIMIT 1', { bind: [child_id] });
    if (!pings.length) return res.status(409).json({ error: 'No location yet for this child, so the SOS cannot say where they are' });
    ({ latitude, longitude } = pings[0]);
  }
  await panicSvc.trigger(child_id, { latitude, longitude });
  res.json({ message: 'SOS alert sent to all emergency contacts' });
};
