const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const bcrypt = require('bcryptjs');

const Parent = sequelize.define('Parent', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  full_name:          { type: DataTypes.STRING(120), allowNull: false },
  email:              { type: DataTypes.STRING(255), unique: true },
  phone:              { type: DataTypes.STRING(20), allowNull: false, unique: true },
  password_hash:      { type: DataTypes.TEXT, allowNull: false },
  preferred_language: { type: DataTypes.ENUM('en','ha','yo','ig','pc'), defaultValue: 'en' },
  subscription_plan:  { type: DataTypes.ENUM('free','basic','pro'), defaultValue: 'free' },
  is_verified:        { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:          { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login_at:      { type: DataTypes.DATE },
}, { tableName: 'parents', underscored: true });

Parent.prototype.validatePassword = function(plain) {
  return bcrypt.compare(plain, this.password_hash);
};

Parent.beforeCreate(async (parent) => {
  parent.password_hash = await bcrypt.hash(parent.password_hash, 12);
});

module.exports = Parent;
