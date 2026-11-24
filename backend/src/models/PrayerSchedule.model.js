const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const PrayerSchedule = sequelize.define('PrayerSchedule', {
  id:                     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  child_id:               { type: DataTypes.UUID, allowNull: false, unique: true },
  service_type:           { type: DataTypes.ENUM('islamic','christian','both'), defaultValue: 'islamic' },
  is_enabled:             { type: DataTypes.BOOLEAN, defaultValue: false },
  city:                   { type: DataTypes.STRING(100) },
  state:                  { type: DataTypes.STRING(60) },
  country:                { type: DataTypes.STRING(60), defaultValue: 'Nigeria' },
  latitude:               { type: DataTypes.DECIMAL(9,6) },
  longitude:              { type: DataTypes.DECIMAL(9,6) },
  calculation_method:     { type: DataTypes.STRING(40), defaultValue: 'Muslim_World_League' },
  locked_prayers:         { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ['fajr','dhuhr','asr','maghrib','isha'] },
  lock_buffer_mins:       { type: DataTypes.SMALLINT, defaultValue: 15 },
  include_jumuah:         { type: DataTypes.BOOLEAN, defaultValue: true },
  jumuah_start:           { type: DataTypes.STRING(5), defaultValue: '12:30' },
  jumuah_end:             { type: DataTypes.STRING(5), defaultValue: '14:00' },
  christian_lock_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  christian_start:        { type: DataTypes.STRING(5), defaultValue: '09:00' },
  christian_end:          { type: DataTypes.STRING(5), defaultValue: '13:00' },
}, { tableName: 'prayer_schedules', underscored: true });

module.exports = PrayerSchedule;
