const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const ActivityLog = sequelize.define('ActivityLog', {
  id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  child_id:    { type: DataTypes.UUID, allowNull: false },
  device_id:   { type: DataTypes.UUID, allowNull: false },
  activity_type: { type: DataTypes.STRING(30), allowNull: false },
  app_package: { type: DataTypes.STRING(200) },
  app_name:    { type: DataTypes.STRING(100) },
  url_domain:  { type: DataTypes.STRING(200) },
  search_term: { type: DataTypes.TEXT },
  category:    { type: DataTypes.STRING(60) },
  was_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  threat_score:{ type: DataTypes.SMALLINT },
  metadata:    { type: DataTypes.JSONB },
  logged_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'activity_logs', underscored: true, timestamps: false });

module.exports = ActivityLog;
