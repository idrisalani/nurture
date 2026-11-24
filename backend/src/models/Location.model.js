const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Location = sequelize.define('Location', {
  id:              { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  child_id:        { type: DataTypes.UUID, allowNull: false },
  device_id:       { type: DataTypes.UUID, allowNull: false },
  latitude:        { type: DataTypes.DECIMAL(9,6), allowNull: false },
  longitude:       { type: DataTypes.DECIMAL(9,6), allowNull: false },
  accuracy_metres: { type: DataTypes.SMALLINT },
  speed_kmh:       { type: DataTypes.DECIMAL(5,2) },
  address:         { type: DataTypes.TEXT },
  source:          { type: DataTypes.STRING(20), defaultValue: 'gps' },
  battery_pct:     { type: DataTypes.SMALLINT },
  recorded_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'location_pings', underscored: true, timestamps: false });

module.exports = Location;
