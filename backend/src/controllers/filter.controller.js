const { sequelize } = require('../config/db.config');

const CONTENT_CATEGORIES = [
  { key: 'adult', label_en: 'Adult Content', label_ha: 'Abun ciki na manya', label_yo: 'Àkóónú àgbàlagbà', label_ig: 'Ọdịnaya ndị okenye', blocked: true },
  { key: 'gambling', label_en: 'Gambling', label_ha: 'Caca', label_yo: 'Ẹtọ̀', label_ig: 'Egwuregwu ego', blocked: true },
  { key: 'violence', label_en: 'Violence', label_ha: 'Tashin hankali', label_yo: 'Ìwà ipá', label_ig: 'Ime ihe ike', blocked: true },
  { key: 'drugs', label_en: 'Drugs & Alcohol', label_ha: 'Magunguna', label_yo: 'Oogun', label_ig: 'Ọgwụ', blocked: true },
  { key: 'social_media', label_en: 'Social Media (limited)', blocked: false },
  { key: 'gaming', label_en: 'Gaming (2hr max)', blocked: false },
  { key: 'education', label_en: 'Education', blocked: false },
];

exports.getCategories = (req, res) => res.json(CONTENT_CATEGORIES);

exports.getFilterConfig = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM app_limits WHERE child_id=$1', { bind: [req.params.childId] });
  res.json({ categories: CONTENT_CATEGORIES, app_limits: rows });
};

exports.updateFilterConfig = async (req, res) => {
  const { childId } = req.params;
  const { categories } = req.body;
  for (const cat of categories) {
    await sequelize.query(
      `INSERT INTO app_limits (child_id, app_category, is_blocked) VALUES ($1,$2,$3)
       ON CONFLICT (child_id, app_category) DO UPDATE SET is_blocked=$3`,
      { bind: [childId, cat.key, cat.blocked] }
    );
  }
  res.json({ message: 'Filter config saved' });
};

exports.addBlockedUrl = async (req, res) => {
  const { url } = req.body;
  res.status(201).json({ message: `${url} added to block list` });
};

exports.removeBlockedUrl = async (req, res) => {
  res.json({ message: 'URL removed from block list' });
};
