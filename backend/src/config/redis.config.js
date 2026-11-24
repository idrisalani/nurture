const Redis = require('ioredis');
const logger = require('./logger');
const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});
redisClient.on('error', (err) => logger.error('Redis error:', err));
const setCache = async (key, value, ttlSeconds) => redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
const getCache = async (key) => { const v = await redisClient.get(key); return v ? JSON.parse(v) : null; };
const delCache = async (key) => redisClient.del(key);
module.exports = { redisClient, setCache, getCache, delCache };
