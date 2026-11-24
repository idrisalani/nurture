const { sequelize } = require('../config/db.config');

exports.getRoutines = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM routines WHERE child_id=$1 AND is_active=true ORDER BY start_time', { bind: [req.params.childId] });
  res.json(rows);
};

exports.createRoutine = async (req, res) => {
  const { name, action, days_of_week, start_time, end_time, icon, color } = req.body;
  const [rows] = await sequelize.query(
    'INSERT INTO routines (child_id, name, action, days_of_week, start_time, end_time, icon, color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    { bind: [req.params.childId, name, action, days_of_week, start_time, end_time, icon || '📅', color || '#1D9E75'] }
  );
  res.status(201).json(rows[0]);
};

exports.updateRoutine = async (req, res) => {
  await sequelize.query(
    'UPDATE routines SET name=$1, action=$2, days_of_week=$3, start_time=$4, end_time=$5, is_active=$6, updated_at=NOW() WHERE id=$7 AND child_id=$8',
    { bind: [req.body.name, req.body.action, req.body.days_of_week, req.body.start_time, req.body.end_time, req.body.is_active, req.params.id, req.params.childId] }
  );
  res.json({ message: 'Routine updated' });
};

exports.deleteRoutine = async (req, res) => {
  await sequelize.query('UPDATE routines SET is_active=false WHERE id=$1 AND child_id=$2', { bind: [req.params.id, req.params.childId] });
  res.json({ message: 'Routine removed' });
};

exports.getPresets = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM routine_presets ORDER BY display_order');
  res.json(rows);
};

exports.applyPreset = async (req, res) => {
  const [presets] = await sequelize.query('SELECT * FROM routine_presets WHERE preset_key=$1', { bind: [req.body.preset_key] });
  if (!presets.length) return res.status(404).json({ error: 'Preset not found' });
  const p = presets[0];
  const [rows] = await sequelize.query(
    'INSERT INTO routines (child_id, name, action, days_of_week, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    { bind: [req.params.childId, p.name_en, p.action, p.days_of_week, p.start_time, p.end_time] }
  );
  res.status(201).json(rows[0]);
};
