const { sequelize } = require('../config/db.config');

exports.getSocialAlerts = async (req, res) => {
  const [rows] = await sequelize.query(
    'SELECT * FROM social_logs WHERE child_id=$1 AND threat_score >= 40 ORDER BY logged_at DESC LIMIT 50',
    { bind: [req.params.childId] }
  );
  res.json(rows);
};

exports.getKeywords = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM social_keywords WHERE parent_id=$1 AND is_active=true', { bind: [req.parentId] });
  res.json(rows);
};

exports.addKeyword = async (req, res) => {
  const { keyword, language, severity } = req.body;
  const [rows] = await sequelize.query(
    'INSERT INTO social_keywords (parent_id, keyword, language, severity) VALUES ($1,$2,$3,$4) RETURNING *',
    { bind: [req.parentId, keyword, language, severity || 'warning'] }
  );
  res.status(201).json(rows[0]);
};

exports.removeKeyword = async (req, res) => {
  await sequelize.query('UPDATE social_keywords SET is_active=false WHERE id=$1 AND parent_id=$2', { bind: [req.params.id, req.parentId] });
  res.json({ message: 'Keyword removed' });
};

exports.getPlatforms = (req, res) => {
  res.json([
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', supported: true },
    { key: 'instagram', label: 'Instagram', icon: '📸', supported: true },
    { key: 'tiktok', label: 'TikTok', icon: '🎵', supported: true },
    { key: 'youtube', label: 'YouTube', icon: '▶️', supported: true },
    { key: 'audiomack', label: 'Audiomack', icon: '🎶', supported: true, africa: true },
    { key: 'boomplay', label: 'Boomplay', icon: '🎵', supported: true, africa: true },
    { key: 'nairaland', label: 'Nairaland', icon: '🇳🇬', supported: true, africa: true },
  ]);
};
