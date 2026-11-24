/**
 * NurtureNet — Devices (pairing, config, heartbeat) Unit Tests
 * Run: npm test (from /backend directory)
 * Coverage: pair, getConfig, heartbeat
 */

const request  = require('supertest');
const app      = require('../src/app');
const { sequelize } = require('../src/config/db.config');

// ── MOCKS ─────────────────────────────────────────────────────────────────────
// Mock db.config FIRST so Sequelize never tries to connect (no DATABASE_URL in test env)
// Mock auth middleware so 'Bearer mock-access-token' is treated as authenticated
jest.mock('../src/middleware/auth.middleware', () => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  if (token !== 'mock-access-token') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.parentId = 'test-parent-id';
  req.token = token;
  next();
});

// Mock Firebase Admin so it never tries to init with real credentials
jest.mock('../src/config/firebase.config', () => ({
  messaging: () => ({
    send: jest.fn().mockResolvedValue('projects/test/messages/1'),
  }),
  apps: [true], // pretend already initialised
}));

jest.mock('../src/config/db.config', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([[]]),
    define: jest.fn(),
    transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }),
  },
}));

jest.mock('../src/middleware/deviceAuth.middleware', () => (req, res, next) => {
  if (req.headers.device_id !== 'dev-1' || req.headers.child_id !== 'kid-1') return res.status(401).json({ error: 'Device not authorized' });
  req.deviceId = 'dev-1'; req.childId = 'kid-1'; next();
});

jest.mock('../src/models/Parent.model', () => ({
  findOne:   jest.fn(),
  findByPk:  jest.fn(),
  create:    jest.fn(),
  update:    jest.fn(),
}));
jest.mock('../src/config/redis.config', () => ({
  setCache: jest.fn().mockResolvedValue('OK'),
  getCache: jest.fn().mockResolvedValue(null),
  delCache: jest.fn().mockResolvedValue(1),
}));
jest.mock('../src/services/sms.service', () => ({
  sendOtp: jest.fn().mockResolvedValue({ status: 'mock' }),
}));
jest.mock('../src/config/jwt.config', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken:  'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  // verifyAccess is called by auth.middleware.js — must not throw
  verifyAccess:  jest.fn().mockImplementation((token) => {
    if (token === 'mock-access-token') return { parentId: 'test-parent-id', type: 'access' };
    throw new Error('Invalid token');
  }),
  verifyRefresh: jest.fn().mockImplementation((token) => {
    if (token === 'mock-refresh-token') return { parentId: 'test-parent-id', type: 'refresh' };
    throw new Error('Invalid refresh token');
  }),
}));

const Parent   = require('../src/models/Parent.model');
const redis    = require('../src/config/redis.config');
const smsSvc   = require('../src/services/sms.service');

// ── TEST DATA ─────────────────────────────────────────────────────────────────
const VALID_PARENT = {
  id:                 'test-uuid-123',
  full_name:          'Mrs. Folake Adeyemi',
  phone:              '+2348012345678',
  email:              'folake@test.com',
  password_hash:      '$2b$12$hashedpassword',
  preferred_language: 'yo',
  subscription_plan:  'basic',
  is_verified:        true,
  is_active:          true,
  last_login_at:      null,
  validatePassword:   jest.fn(),
};

// ── REGISTER ──────────────────────────────────────────────────────────────────

const DEV = { device_id: 'dev-1', child_id: 'kid-1' };
beforeEach(() => { sequelize.query.mockReset(); });

describe('POST /api/v1/devices/pair', () => {
  const body = { code: '482916', device_name: 'Tecno Spark 10' };
  it('links the phone and returns device credentials', async () => {
    sequelize.query
      .mockResolvedValueOnce([[{ id: 'code-1', child_id: 'kid-1' }]])   // find live code
      .mockResolvedValueOnce([[{ id: 'dev-9', child_id: 'kid-1' }]])    // insert device
      .mockResolvedValueOnce([[]]);                                     // burn code
    const res = await request(app).post('/api/v1/devices/pair').send(body);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ device_id: 'dev-9', child_id: 'kid-1' });
  });
  it('rejects a wrong or expired code', async () => {
    sequelize.query.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/api/v1/devices/pair').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/wrong or has expired/);
  });
  it('rejects a code that is not 6 digits', async () => {
    const res = await request(app).post('/api/v1/devices/pair').send({ ...body, code: '12ab56' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/devices/config', () => {
  it('needs device credentials', async () => {
    expect((await request(app).get('/api/v1/devices/config')).status).toBe(401);
  });
  it('returns normalised rules for the child', async () => {
    sequelize.query
      .mockResolvedValueOnce([[{ id: 'kid-1', full_name: 'Amara Bello' }]])
      .mockResolvedValueOnce([[{ weekday_limit_mins: 120, weekend_limit_mins: 180, warn_at_percent: 80, school_lock_enabled: true, school_lock_days: [1,2,3,4,5], school_lock_start: '08:00:00', school_lock_end: '15:00:00', bedtime_lock_enabled: true, bedtime_days: [1,2,3,4,5,6,7], bedtime_start: '21:00:00', bedtime_end: '06:00:00', internet_paused: false }]])
      .mockResolvedValueOnce([[{ is_enabled: true, city: 'Kano', locked_prayers: ['fajr','isha'], lock_buffer_mins: 15, include_jumuah: true, jumuah_start: '12:30', jumuah_end: '14:00', christian_lock_enabled: false }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ app_package: null, app_category: 'gambling', is_blocked: true, daily_limit_mins: 60 }]]);
    const res = await request(app).get('/api/v1/devices/config').set(DEV);
    expect(res.status).toBe(200);
    expect(res.body.limits.bedtime).toEqual({ enabled: true, days: [1,2,3,4,5,6,7], start: '21:00', end: '06:00' });
    expect(res.body.limits.school.start).toBe('08:00');
    expect(res.body.limits.paused).toBe(false);
    expect(res.body.prayer.city).toBe('Kano');
    expect(res.body.exam).toBeNull();
    expect(res.body.app_rules).toEqual([{ package: null, category: 'gambling', blocked: true, daily_limit_mins: 60 }]);
    expect(typeof res.body.server_time).toBe('string');
  });
  it('treats an expired pause as not paused', async () => {
    sequelize.query
      .mockResolvedValueOnce([[{ id: 'kid-1', full_name: 'A' }]])
      .mockResolvedValueOnce([[{ weekday_limit_mins: 120, weekend_limit_mins: 180, internet_paused: true, internet_paused_until: new Date(Date.now() - 60000).toISOString() }]])
      .mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/v1/devices/config').set(DEV);
    expect(res.body.limits.paused).toBe(false);
  });
});

describe('POST /api/v1/devices/heartbeat', () => {
  it('updates last seen', async () => {
    sequelize.query.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/api/v1/devices/heartbeat').set(DEV).send({ app_version: '1.0.0' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sequelize.query.mock.calls[0][1].bind.slice(0, 2)).toEqual(['dev-1', 'kid-1']);
  });
});
