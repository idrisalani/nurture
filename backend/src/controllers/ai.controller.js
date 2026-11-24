const nlpSvc = require('../services/nlp.service');
const ThreatLog = require('../models/ThreatLog.model');
const alertSvc = require('../services/push.service');
const { sequelize } = require('../config/db.config');
const crypto = require('crypto');

exports.scanMessage = async (req, res) => {
  const { content, platform } = req.body;
  if (!content?.trim()) return res.json({ threat_score: 0 });
  
  const result = await nlpSvc.scan(content, 'social_message', platform);
  
  if (result.threat_score >= 70) {
    // Get parent for alert
    const [parents] = await sequelize.query(
      'SELECT p.id, p.preferred_language FROM parents p JOIN children c ON c.parent_id = p.id WHERE c.id = $1',
      { bind: [req.childId] }
    );
    if (parents.length) {
      await alertSvc.sendThreatAlert(parents[0].id, req.childId, result, parents[0].preferred_language);
    }
  }
  
  res.json({ threat_score: result.threat_score, threat_categories: result.threat_categories });
};

exports.scanSearch = async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.json({ threat_score: 0 });
  const result = await nlpSvc.scan(query, 'web_search');
  res.json({ threat_score: result.threat_score, safe: result.threat_score < 40 });
};

exports.getThreatLog = async (req, res) => {
  const logs = await ThreatLog.findAll({
    where: { child_id: req.params.childId },
    order: [['scanned_at', 'DESC']],
    limit: 50,
    attributes: { exclude: ['content_preview'] }, // don't send raw content to client
  });
  res.json(logs);
};

exports.reviewThreat = async (req, res) => {
  const { parent_marked_safe, parent_note } = req.body;
  await ThreatLog.update(
    { reviewed_by_parent: true, parent_marked_safe, parent_note },
    { where: { id: req.params.id } }
  );
  res.json({ message: 'Threat review saved' });
};
