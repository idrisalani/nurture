const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Alert = sequelize.define('Alert', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  parent_id:   { type: DataTypes.UUID, allowNull: false },
  child_id:    { type: DataTypes.UUID },
  alert_type:  { type: DataTypes.STRING(50), allowNull: false },
  severity:    { type: DataTypes.ENUM('info','warning','critical'), defaultValue: 'info' },
  title_en:    { type: DataTypes.TEXT, allowNull: false },
  title_ha:    { type: DataTypes.TEXT },
  title_yo:    { type: DataTypes.TEXT },
  title_ig:    { type: DataTypes.TEXT },
  title_pc:    { type: DataTypes.TEXT },
  body_en:     { type: DataTypes.TEXT, allowNull: false },
  body_ha:     { type: DataTypes.TEXT },
  body_yo:     { type: DataTypes.TEXT },
  body_ig:     { type: DataTypes.TEXT },
  body_pc:     { type: DataTypes.TEXT },
  metadata:    { type: DataTypes.JSONB, defaultValue: {} },
  push_sent:   { type: DataTypes.BOOLEAN, defaultValue: false },
  sms_sent:    { type: DataTypes.BOOLEAN, defaultValue: false },
  is_read:     { type: DataTypes.BOOLEAN, defaultValue: false },
  dedup_key:   { type: DataTypes.STRING(200), unique: true },
}, { tableName: 'alerts', underscored: true });

module.exports = Alert;
