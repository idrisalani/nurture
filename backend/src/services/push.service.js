const admin = require('../config/firebase.config');
const Alert = require('../models/Alert.model');

const ALERT_MESSAGES = {
  screen_time_exceeded: {
    en: { title: 'Screen Time Limit Reached', body: (name) => `${name} has used all screen time for today.` },
    ha: { title: 'Lokacin Allon Ya Ƙare', body: (name) => `${name} ya yi amfani da dukkan lokacin allon yau.` },
    yo: { title: 'Àkókò Iboju Ti Parí', body: (name) => `${name} ti lo gbogbo àkókò iboju fún òní.` },
    ig: { title: 'Oge Ihuenyo Eruola', body: (name) => `${name} ejirila oge ihuenyo niile taa.` },
    pc: { title: 'Screen Time Don Finish', body: (name) => `${name} don use all im screen time for today.` },
  },
};

exports.sendPush = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
};

exports.sendThreatAlert = async (parentId, childId, threatResult, lang = 'en') => {
  const dedup = `ai_threat:${childId}:${threatResult.content_hash}`;
  const existing = await Alert.findOne({ where: { dedup_key: dedup } });
  if (existing) return;
  await Alert.create({
    parent_id: parentId, child_id: childId,
    alert_type: 'ai_threat_detected', severity: 'critical',
    title_en: 'AI Safety Alert', body_en: `Concerning content detected (score: ${threatResult.threat_score}/100). Categories: ${threatResult.threat_categories?.join(', ')}.`,
    title_ha: 'Faɗakarwar Tsaro', body_ha: 'An gano abun ciki mai damuwa.',
    title_yo: 'Ìkìlọ̀ Ààbò AI', body_yo: 'A ṣàwárí àkóónú tó ní ìdààmú.',
    title_ig: 'Ọdụmọdụ Nchedo AI', body_ig: 'Achọtara ọdịnaya ize ndụ.',
    title_pc: 'Safety Alert', body_pc: 'Dem find something wey no good for your pikin phone.',
    metadata: { threat_score: threatResult.threat_score, categories: threatResult.threat_categories },
    dedup_key: dedup,
  });
};
