const { sequelize } = require('../config/db.config');
const { setCache, getCache } = require('../config/redis.config');
const alertSvc = require('../services/push.service');

exports.getLimits = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM screen_limits WHERE child_id = $1', { bind: [req.params.childId] });
  if (!rows.length) return res.status(404).json({ error: 'No limits configured' });
  const [appLimits] = await sequelize.query('SELECT * FROM app_limits WHERE child_id = $1', { bind: [req.params.childId] });
  res.json({ limits: rows[0], app_limits: appLimits });
};

exports.updateLimits = async (req, res) => {
  const { childId } = req.params;
  const { weekday_limit_mins, weekend_limit_mins, school_lock_enabled, bedtime_lock_enabled, bedtime_start, bedtime_end, school_lock_start, school_lock_end } = req.body;
  await sequelize.query(
    `UPDATE screen_limits SET weekday_limit_mins=$1, weekend_limit_mins=$2, school_lock_enabled=$3, 
     bedtime_lock_enabled=$4, bedtime_start=$5, bedtime_end=$6,
     school_lock_start=COALESCE($8::time, school_lock_start), school_lock_end=COALESCE($9::time, school_lock_end), updated_at=NOW()
     WHERE child_id=$7`,
    { bind: [weekday_limit_mins, weekend_limit_mins, school_lock_enabled, bedtime_lock_enabled, bedtime_start, bedtime_end, childId, school_lock_start || null, school_lock_end || null] }
  );
  // Invalidate device cache so child device picks up new limits
  await setCache(`limits:${childId}`, null, 1);
  res.json({ message: 'Screen limits updated' });
};

exports.pauseInternet = async (req, res) => {
  const { child_id, duration_mins } = req.body;
  const until = duration_mins ? new Date(Date.now() + duration_mins * 60000) : null;
  await sequelize.query(
    'UPDATE screen_limits SET internet_paused=true, internet_paused_until=$1 WHERE child_id=$2',
    { bind: [until, child_id] }
  );
  await setCache(`paused:${child_id}`, '1', duration_mins ? duration_mins * 60 : 86400);
  res.json({ message: 'Internet paused', until });
};

exports.resumeInternet = async (req, res) => {
  const { child_id } = req.body;
  await sequelize.query('UPDATE screen_limits SET internet_paused=false WHERE child_id=$1', { bind: [child_id] });
  res.json({ message: 'Internet resumed' });
};

exports.syncUsage = async (req, res) => {
  // Child device posts array of app usage
  const { usage } = req.body; // [{ app_package, app_name, minutes_used }]
  for (const u of usage) {
    await sequelize.query(
      `INSERT INTO screen_usage (child_id, device_id, app_package, app_name, minutes_used)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (child_id, device_id, usage_date, app_package)
       DO UPDATE SET minutes_used = EXCLUDED.minutes_used, last_synced_at = NOW()`,
      { bind: [req.childId, req.deviceId, u.app_package, u.app_name, u.minutes_used] }
    );
  }
  res.json({ synced: usage.length });
};

exports.checkAllowed = async (req, res) => {
  // Child device checks if it's currently allowed to use internet
  const paused = await getCache(`paused:${req.childId}`);
  if (paused) return res.json({ allowed: false, reason: 'internet_paused' });
  // Check exam mode
  const examActive = await getCache(`exammode:${req.childId}`);
  if (examActive) return res.json({ allowed: false, reason: 'exam_mode', allowed_apps: JSON.parse(examActive).allowed_apps });
  res.json({ allowed: true });
};

exports.getUsage = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT app_package, app_name, SUM(minutes_used) as total_mins
     FROM screen_usage WHERE child_id=$1 AND usage_date >= CURRENT_DATE - INTERVAL '7 days'
     GROUP BY app_package, app_name ORDER BY total_mins DESC LIMIT 20`,
    { bind: [req.params.childId] }
  );
  res.json(rows);
};
