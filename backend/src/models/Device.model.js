const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Device = sequelize.define('Device', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  child_id:           { type: DataTypes.UUID, allowNull: false },
  device_name:        { type: DataTypes.STRING(100), allowNull: false },
  device_model:       { type: DataTypes.STRING(100) },
  platform:           { type: DataTypes.ENUM('android','ios','kindle'), defaultValue: 'android' },
  os_version:         { type: DataTypes.STRING(20) },
  fcm_token:          { type: DataTypes.TEXT },
  app_version:        { type: DataTypes.STRING(20) },
  status:             { type: DataTypes.ENUM('active','inactive','blocked','pending'), defaultValue: 'pending' },
  is_primary:         { type: DataTypes.BOOLEAN, defaultValue: false },
  admin_enabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  last_seen_at:       { type: DataTypes.DATE },
}, { tableName: 'devices', underscored: true });

module.exports = Device;
