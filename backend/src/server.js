require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/db.config');
const { redisClient } = require('./config/redis.config');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected');
    await redisClient.ping();
    logger.info('Redis connected');
    app.listen(PORT, () => logger.info(`NurtureNet API running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
