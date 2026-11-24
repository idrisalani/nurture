const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Subscription = sequelize.define('Subscription', {
  id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  parent_id:            { type: DataTypes.UUID, allowNull: false, unique: true },
  plan:                 { type: DataTypes.ENUM('free','basic','pro'), defaultValue: 'free' },
  status:               { type: DataTypes.ENUM('active','past_due','cancelled','expired','trial','paused'), defaultValue: 'active' },
  provider:             { type: DataTypes.ENUM('paystack','flutterwave','manual','promo') },
  payment_method:       { type: DataTypes.STRING(30) },
  amount_ngn:           { type: DataTypes.INTEGER },
  billing_cycle:        { type: DataTypes.STRING(20), defaultValue: 'monthly' },
  provider_customer_id: { type: DataTypes.TEXT },
  provider_sub_id:      { type: DataTypes.TEXT },
  current_period_start: { type: DataTypes.DATE },
  current_period_end:   { type: DataTypes.DATE },
  cancelled_at:         { type: DataTypes.DATE },
}, { tableName: 'subscriptions', underscored: true });

module.exports = Subscription;
