const { Sequelize } = require('sequelize');
const logger = require('./logger');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  dialectOptions: { ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false },
});
module.exports = { sequelize };
