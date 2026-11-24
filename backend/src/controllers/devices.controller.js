const { sequelize } = require('../config/db.config');

exports.pair = async (req, res) => {
  const { code, device_name, device_model, platform = 'android', os_version, fcm_token, device_fingerprint, app_version } = req.body;
  const t = await sequelize.transaction();
  try {
    const [codes] = await sequelize.query(
      'SELECT id, child_id FROM device_pairing_codes WHERE code=$1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE',
      { bind: [code], transaction: t });
    if (!codes.length) { await t.rollback(); return res.status(400).json({ error: 'That code is wrong or has expired' }); }
    const [dev] = await sequelize.query(
      `INSERT INTO devices (child_id, device_name, device_model, platform, os_version, fcm_token, device_fingerprint, app_version, status, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',NOW()) RETURNING id, child_id`,
      { bind: [codes[0].child_id, device_name, device_model || null, ['android', 'ios', 'kindle'].includes(platform) ? platform : 'android', os_version || null, fcm_token || null, device_fingerprint || null, app_version || null], transaction: t });
    await sequelize.query('UPDATE device_pairing_codes SET used_at=NOW() WHERE id=$1', { bind: [codes[0].id], transaction: t });
    await t.commit();
    // The child app stores these two values and sends them as device_id / child_id headers (see deviceAuth).
    res.status(201).json({ device_id: dev[0].id, child_id: dev[0].child_id });
  } catch (e) { await t.rollback(); res.status(500).json({ error: 'Could not link the phone' }); }
};

const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

// Everything the child's phone needs to enforce the rules offline. One call, no plan gating (the parent's plan is checked on the parent side).
exports.getConfig = async (req, res) => {
  const childId = req.childId;
  const child = (await sequelize.query('SELECT id, full_name FROM children WHERE id=$1', { bind: [childId] }))[0][0];
  if (!child) return res.status(404).json({ error: 'Child not found' });
  const [limits, prayer, exam, appLimits] = await Promise.all([
    sequelize.query('SELECT * FROM screen_limits WHERE child_id=$1', { bind: [childId] }).then(r => r[0][0]),
    sequelize.query('SELECT * FROM prayer_schedules WHERE child_id=$1', { bind: [childId] }).then(r => r[0][0]),
    sequelize.query("SELECT * FROM exam_modes WHERE child_id=$1 AND is_active=true AND end_date >= CURRENT_DATE ORDER BY created_at DESC LIMIT 1", { bind: [childId] }).then(r => r[0][0]),
    sequelize.query('SELECT app_package, app_category, is_blocked, daily_limit_mins FROM app_limits WHERE child_id=$1', { bind: [childId] }).then(r => r[0]),
  ]);
  const l = limits || {};
  res.json({
    server_time: new Date().toISOString(),
    child: { id: child.id, full_name: child.full_name },
    limits: limits ? {
      weekday_mins: l.weekday_limit_mins, weekend_mins: l.weekend_limit_mins, warn_at_percent: l.warn_at_percent,
      school: { enabled: !!l.school_lock_enabled, days: l.school_lock_days || [1, 2, 3, 4, 5], start: hhmm(l.school_lock_start), end: hhmm(l.school_lock_end) },
      bedtime: { enabled: !!l.bedtime_lock_enabled, days: l.bedtime_days || [1, 2, 3, 4, 5, 6, 7], start: hhmm(l.bedtime_start), end: hhmm(l.bedtime_end) },
      paused: !!l.internet_paused && (!l.internet_paused_until || new Date(l.internet_paused_until) > new Date()),
      paused_until: l.internet_paused_until || null,
    } : null,
    prayer: prayer && prayer.is_enabled ? {
      city: prayer.city, locked: prayer.locked_prayers || [], buffer_mins: prayer.lock_buffer_mins,
      jumuah: { enabled: !!prayer.include_jumuah, start: prayer.jumuah_start, end: prayer.jumuah_end },
      church: { enabled: !!prayer.christian_lock_enabled, start: prayer.christian_start, end: prayer.christian_end },
    } : null,
    exam: exam ? {
      body: exam.exam_body, start_date: exam.start_date, end_date: exam.end_date, allowed_packages: exam.allowed_app_packages || [],
      block: { social: !!exam.block_social_media, gaming: !!exam.block_gaming, entertainment: !!exam.block_entertainment, messaging: !!exam.block_messaging },
      study: { enabled: !!exam.study_hours_enabled, start: exam.study_start, end: exam.study_end },
    } : null,
    app_rules: appLimits.map(a => ({ package: a.app_package, category: a.app_category, blocked: !!a.is_blocked, daily_limit_mins: a.daily_limit_mins })),
  });
};

// Phone checks in. Keeps "last seen" fresh and the push token current.
exports.heartbeat = async (req, res) => {
  const { fcm_token, app_version, os_version } = req.body;
  await sequelize.query(
    `UPDATE devices SET last_seen_at=NOW(), fcm_token=COALESCE($3, fcm_token), app_version=COALESCE($4, app_version), os_version=COALESCE($5, os_version), updated_at=NOW()
     WHERE id=$1 AND child_id=$2`, { bind: [req.deviceId, req.childId, fcm_token || null, app_version || null, os_version || null] });
  res.json({ ok: true, server_time: new Date().toISOString() });
};
