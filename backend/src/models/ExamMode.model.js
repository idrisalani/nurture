const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const ExamMode = sequelize.define('ExamMode', {
  id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  child_id:             { type: DataTypes.UUID, allowNull: false },
  exam_body:            { type: DataTypes.ENUM('WAEC','JAMB','NECO','NABTEB','GCE','CUSTOM'), defaultValue: 'WAEC' },
  exam_year:            { type: DataTypes.SMALLINT },
  custom_name:          { type: DataTypes.STRING(100) },
  start_date:           { type: DataTypes.DATEONLY, allowNull: false },
  end_date:             { type: DataTypes.DATEONLY, allowNull: false },
  is_active:            { type: DataTypes.BOOLEAN, defaultValue: false },
  block_social_media:   { type: DataTypes.BOOLEAN, defaultValue: true },
  block_gaming:         { type: DataTypes.BOOLEAN, defaultValue: true },
  block_entertainment:  { type: DataTypes.BOOLEAN, defaultValue: true },
  block_messaging:      { type: DataTypes.BOOLEAN, defaultValue: false },
  allowed_app_packages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  study_hours_enabled:  { type: DataTypes.BOOLEAN, defaultValue: true },
  study_start:          { type: DataTypes.STRING(5), defaultValue: '08:00' },
  study_end:            { type: DataTypes.STRING(5), defaultValue: '20:00' },
}, { tableName: 'exam_modes', underscored: true });

module.exports = ExamMode;
