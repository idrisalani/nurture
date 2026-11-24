const pushSvc = require('./push.service');
const smsSvc = require('./sms.service');
const { sequelize } = require('../config/db.config');

exports.trigger = async (childId, location) => {
  const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  
  // Get child name and emergency contacts
  const [children] = await sequelize.query('SELECT full_name, parent_id FROM children WHERE id=$1', { bind: [childId] });
  if (!children.length) return;
  const child = children[0];
  
  const [contacts] = await sequelize.query(
    'SELECT * FROM emergency_contacts WHERE parent_id=$1 LIMIT 3',
    { bind: [child.parent_id] }
  );
  
  // Get parent FCM token
  const [devices] = await sequelize.query(
    "SELECT d.fcm_token FROM devices d JOIN children c ON c.id=d.child_id WHERE c.parent_id=$1 AND d.status='active' LIMIT 3",
    { bind: [child.parent_id] }
  );
  
  // Fire all alerts simultaneously
  await Promise.all([
    // Push to parent devices
    ...devices.map(d => pushSvc.sendPush(d.fcm_token, `🆘 ${child.full_name} needs help!`, `Tap to see location`, { maps_url: mapsUrl, type: 'panic' })),
    // SMS to emergency contacts
    ...contacts.map(c => smsSvc.sendPanicSms(c.phone, child.full_name, mapsUrl)),
    // Log incident
    sequelize.query(
      'INSERT INTO panic_logs (child_id, latitude, longitude, maps_url) VALUES ($1,$2,$3,$4)',
      { bind: [childId, location.latitude, location.longitude, mapsUrl] }
    ),
  ]);
  
  console.log(`🆘 Panic triggered for ${child.full_name} — ${contacts.length} contacts notified`);
};
