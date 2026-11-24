const axios = require('axios');
const { setCache, getCache } = require('../config/redis.config');
const PrayerSchedule = require('../models/PrayerSchedule.model');
const { sequelize } = require('../config/db.config');

exports.getPrayerTimes = async (req, res) => {
  const { city = 'Lagos', date = 'today', method = 3 } = req.query;
  const cacheKey = `prayer:${city.toLowerCase()}:${date}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ ...cached, source: 'cache' });
  try {
    const resp = await axios.get(`${process.env.ALADHAN_BASE_URL}/timingsByCity/${date}`, {
      params: { city, country: 'Nigeria', method },
      timeout: 5000,
    });
    const timings = resp.data.data.timings;
    await setCache(cacheKey, { timings, city, date }, 24 * 3600);
    res.json({ timings, city, date, source: 'api' });
  } catch (err) {
    res.status(502).json({ error: 'Prayer time service unavailable' });
  }
};

exports.getNigerianCities = async (req, res) => {
  const [cities] = await sequelize.query('SELECT city, state, region FROM nigerian_cities ORDER BY is_popular DESC, city ASC');
  res.json(cities);
};

exports.getSchedule = async (req, res) => {
  const schedule = await PrayerSchedule.findOne({ where: { child_id: req.params.childId } });
  res.json(schedule || {});
};

exports.saveSchedule = async (req, res) => {
  const { childId } = req.params;
  const [schedule, created] = await PrayerSchedule.upsert({ child_id: childId, ...req.body });
  // Cache prayer times for the child's city
  res.status(created ? 201 : 200).json(schedule);
};

exports.updateSchedule = async (req, res) => {
  await PrayerSchedule.update(req.body, { where: { child_id: req.params.childId } });
  res.json({ message: 'Prayer schedule updated' });
};

exports.deleteSchedule = async (req, res) => {
  await PrayerSchedule.destroy({ where: { child_id: req.params.childId } });
  res.json({ message: 'Prayer schedule removed' });
};
