const ExamMode = require('../models/ExamMode.model');
const { sequelize } = require('../config/db.config');
const { setCache, delCache } = require('../config/redis.config');

exports.getExamCalendar = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const [rows] = await sequelize.query(
    'SELECT * FROM nigerian_exam_calendar WHERE exam_year = $1 ORDER BY display_order',
    { bind: [year] }
  );
  res.json(rows);
};

exports.getWhitelistedApps = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM exam_mode_whitelist WHERE is_default = true ORDER BY category, app_name');
  res.json(rows);
};

exports.getExamMode = async (req, res) => {
  const mode = await ExamMode.findOne({ where: { child_id: req.params.childId } });
  res.json(mode || { is_active: false });
};

exports.activateExamMode = async (req, res) => {
  const { childId } = req.params;
  const { exam_body, start_date, end_date, allowed_app_packages } = req.body;
  
  // Get default whitelist
  const [defaultApps] = await sequelize.query('SELECT app_package FROM exam_mode_whitelist WHERE is_default = true');
  const allAllowed = [...new Set([...defaultApps.map(a => a.app_package), ...(allowed_app_packages || [])])];
  
  const [mode] = await ExamMode.upsert({
    child_id: childId, exam_body, start_date, end_date,
    exam_year: new Date(start_date).getFullYear(),
    is_active: true, allowed_app_packages: allAllowed, ...req.body,
  });
  
  // Cache for child device to pick up instantly
  const ttlSeconds = Math.ceil((new Date(end_date) - new Date()) / 1000);
  if (ttlSeconds > 0) {
    await setCache(`exammode:${childId}`, JSON.stringify({ active: true, allowed_apps: allAllowed }), ttlSeconds);
  }
  
  res.status(201).json({ message: `${exam_body} exam mode activated`, mode });
};

exports.updateExamMode = async (req, res) => {
  await ExamMode.update(req.body, { where: { child_id: req.params.childId } });
  res.json({ message: 'Exam mode updated' });
};

exports.deactivateExamMode = async (req, res) => {
  const { childId } = req.params;
  await ExamMode.update({ is_active: false }, { where: { child_id: childId } });
  await delCache(`exammode:${childId}`);
  res.json({ message: 'Exam mode deactivated' });
};
