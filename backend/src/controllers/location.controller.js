const Location = require('../models/Location.model');
const { setCache, getCache } = require('../config/redis.config');
const { sequelize } = require('../config/db.config');

exports.updateLocation = async (req, res) => {
  const { latitude, longitude, accuracy_metres, battery_pct } = req.body;
  // Save to DB
  await Location.create({ child_id: req.childId, device_id: req.deviceId, latitude, longitude, accuracy_metres, battery_pct });
  // Cache latest (30s TTL)
  await setCache(`location:${req.childId}`, { latitude, longitude, accuracy_metres, battery_pct, ts: Date.now() }, 30);
  // Check geofences
  await checkGeofences(req.childId, latitude, longitude);
  res.json({ ok: true });
};

exports.getCurrentLocation = async (req, res) => {
  const cached = await getCache(`location:${req.params.childId}`);
  if (cached) return res.json({ ...cached, source: 'live' });
  const loc = await Location.findOne({ where: { child_id: req.params.childId }, order: [['recorded_at', 'DESC']] });
  if (!loc) return res.status(404).json({ error: 'No location data yet' });
  res.json({ ...loc.toJSON(), source: 'historical' });
};

exports.getLocationHistory = async (req, res) => {
  const { hours = 24 } = req.query;
  const [rows] = await sequelize.query(
    `SELECT latitude, longitude, accuracy_metres, battery_pct, recorded_at FROM location_pings WHERE child_id=$1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2 ORDER BY recorded_at DESC`,
    { bind: [req.params.childId, hours] }
  );
  res.json(rows);
};

exports.getSavedPlaces = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM saved_places WHERE parent_id=$1 AND is_active=true', { bind: [req.parentId] });
  res.json(rows);
};

exports.addSavedPlace = async (req, res) => {
  const { name, latitude, longitude, radius_metres, icon, alert_on_arrive, alert_on_leave } = req.body;
  const [rows] = await sequelize.query(
    'INSERT INTO saved_places (parent_id, name, latitude, longitude, radius_metres, icon, alert_on_arrive, alert_on_leave) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    { bind: [req.parentId, name, latitude, longitude, radius_metres || 150, icon || '📍', alert_on_arrive !== false, alert_on_leave !== false] }
  );
  res.status(201).json(rows[0]);
};

exports.deleteSavedPlace = async (req, res) => {
  await sequelize.query('UPDATE saved_places SET is_active=false WHERE id=$1 AND parent_id=$2', { bind: [req.params.id, req.parentId] });
  res.json({ message: 'Place removed' });
};

exports.smsLocate = async (req, res) => {
  // Termii webhook — parent SMS'd "LOCATE" to child's number
  res.sendStatus(200);
};

async function checkGeofences(childId, lat, lng) {
  // Simple geofence check — compare distance to all saved places
  const [parents] = await sequelize.query('SELECT parent_id FROM children WHERE id=$1', { bind: [childId] });
  if (!parents.length) return;
  const [places] = await sequelize.query(
    'SELECT * FROM saved_places WHERE parent_id=$1 AND is_active=true AND $2=ANY(apply_to_children) OR array_length(apply_to_children,1) IS NULL',
    { bind: [parents[0].parent_id, childId] }
  );
  for (const place of places) {
    const dist = haversine(lat, lng, place.latitude, place.longitude);
    if (dist <= place.radius_metres) {
      // Inside geofence — check if we already recorded an arrive event recently
      const [recent] = await sequelize.query(
        "SELECT id FROM geofence_events WHERE child_id=$1 AND place_id=$2 AND event_type='arrive' AND occurred_at > NOW() - INTERVAL '30 minutes'",
        { bind: [childId, place.id] }
      );
      if (!recent.length && place.alert_on_arrive) {
        await sequelize.query(
          "INSERT INTO geofence_events (child_id, place_id, event_type, latitude, longitude) VALUES ($1,$2,'arrive',$3,$4)",
          { bind: [childId, place.id, lat, lng] }
        );
      }
    }
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
