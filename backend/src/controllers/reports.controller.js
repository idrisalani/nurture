const { sequelize } = require('../config/db.config');

exports.getWeeklyReport = async (req, res) => {
  const { childId } = req.params;
  const [dailyUsage] = await sequelize.query(
    `SELECT usage_date, SUM(minutes_used) as total_mins FROM screen_usage WHERE child_id=$1 AND usage_date >= CURRENT_DATE - 7 GROUP BY usage_date ORDER BY usage_date`,
    { bind: [childId] }
  );
  const [topApps] = await sequelize.query(
    `SELECT app_package, app_name, SUM(minutes_used) as total_mins FROM screen_usage WHERE child_id=$1 AND usage_date >= CURRENT_DATE - 7 GROUP BY app_package, app_name ORDER BY total_mins DESC LIMIT 10`,
    { bind: [childId] }
  );
  const [blocked] = await sequelize.query(
    `SELECT COUNT(*) as count FROM activity_logs WHERE child_id=$1 AND was_blocked=true AND logged_at >= NOW() - INTERVAL '7 days'`,
    { bind: [childId] }
  );
  res.json({ daily_usage: dailyUsage, top_apps: topApps, blocked_attempts: blocked[0].count });
};

exports.getMonthlyReport = async (req, res) => {
  const { childId } = req.params;
  const [rows] = await sequelize.query(
    `SELECT DATE_TRUNC('week', usage_date) as week, SUM(minutes_used) as total_mins FROM screen_usage WHERE child_id=$1 AND usage_date >= CURRENT_DATE - 30 GROUP BY week ORDER BY week`,
    { bind: [childId] }
  );
  res.json(rows);
};

exports.getAppBreakdown = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT app_package, app_name, SUM(minutes_used) as total_mins, COUNT(DISTINCT usage_date) as days_used FROM screen_usage WHERE child_id=$1 AND usage_date >= CURRENT_DATE - 30 GROUP BY app_package, app_name ORDER BY total_mins DESC`,
    { bind: [req.params.childId] }
  );
  res.json(rows);
};

exports.getBlockedAttempts = async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT url_domain, category, COUNT(*) as attempts, MAX(logged_at) as last_attempt FROM activity_logs WHERE child_id=$1 AND was_blocked=true AND logged_at >= NOW() - INTERVAL '30 days' GROUP BY url_domain, category ORDER BY attempts DESC LIMIT 20`,
    { bind: [req.params.childId] }
  );
  res.json(rows);
};

exports.exportPdf = async (req, res) => {
  res.json({ message: 'PDF export — Pro feature coming in v1.1', upgrade_required: true });
};
