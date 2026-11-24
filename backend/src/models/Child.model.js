const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Child = sequelize.define('Child', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  parent_id:     { type: DataTypes.UUID, allowNull: false },
  full_name:     { type: DataTypes.STRING(120), allowNull: false },
  date_of_birth: { type: DataTypes.DATEONLY },
  avatar_emoji:  { type: DataTypes.STRING(10), defaultValue: '👦' },
  avatar_url:    { type: DataTypes.TEXT },
  pin:           { type: DataTypes.STRING(6) },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'children', underscored: true });

module.exports = Child;
