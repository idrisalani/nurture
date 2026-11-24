const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const ThreatLog = sequelize.define('ThreatLog', {
  id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  child_id:            { type: DataTypes.UUID, allowNull: false },
  device_id:           { type: DataTypes.UUID },
  scan_source:         { type: DataTypes.STRING(30), allowNull: false },
  platform:            { type: DataTypes.STRING(30) },
  content_hash:        { type: DataTypes.STRING(64), allowNull: false, unique: true },
  content_preview:     { type: DataTypes.TEXT },
  language_detected:   { type: DataTypes.STRING(5), defaultValue: 'en' },
  language_confidence: { type: DataTypes.DECIMAL(4,3) },
  threat_score:        { type: DataTypes.SMALLINT, allowNull: false },
  threat_categories:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  flagged_phrases:     { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  ai_model:            { type: DataTypes.STRING(60), defaultValue: 'claude-sonnet-4-20250514' },
  ai_tokens_used:      { type: DataTypes.SMALLINT },
  alert_triggered:     { type: DataTypes.BOOLEAN, defaultValue: false },
  reviewed_by_parent:  { type: DataTypes.BOOLEAN, defaultValue: false },
  parent_marked_safe:  { type: DataTypes.BOOLEAN },
  scanned_at:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  content_purge_at:    { type: DataTypes.DATE },
}, { tableName: 'threat_logs', underscored: true, timestamps: false });

module.exports = ThreatLog;
