/**
 * NurtureNet — Auth Controller Unit Tests
 * Run: npm test (from /backend directory)
 * Coverage: register, verifyOtp, login, refresh, logout, getMe
 */

const request  = require('supertest');
const app      = require('../src/app');
const bcrypt   = require('bcryptjs');

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
  },
}));

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
describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201: creates parent and sends OTP for new phone', async () => {
    Parent.findOne.mockResolvedValue(null);         // phone not taken
    Parent.create.mockResolvedValue({ ...VALID_PARENT, is_verified: false });
    redis.setCache.mockResolvedValue('OK');
    smsSvc.sendOtp.mockResolvedValue({ status: 'mock' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+2348012345678', full_name: 'Mrs. Folake Adeyemi', password: 'test1234', preferred_language: 'yo' });

    expect(res.status).toBe(201);
    expect(res.body.parent_id).toBe('test-uuid-123');
    expect(res.body.message).toMatch(/OTP/i);
    expect(smsSvc.sendOtp).toHaveBeenCalledWith('+2348012345678', expect.any(String), 'yo');
    expect(redis.setCache).toHaveBeenCalledWith(expect.stringContaining('otp:'), expect.any(String), 600);
  });

  it('409: rejects duplicate phone number', async () => {
    Parent.findOne.mockResolvedValue(VALID_PARENT);  // phone already registered

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+2348012345678', full_name: 'Someone Else', password: 'test1234' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
    expect(Parent.create).not.toHaveBeenCalled();
  });

  it('400: rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+2348012345678' });  // missing full_name and password

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation/i);
  });

  it('400: rejects invalid phone format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: 'not-a-phone', full_name: 'Test User', password: 'test1234' });

    expect(res.status).toBe(400);
  });

  it('201: defaults to English when language not provided', async () => {
    Parent.findOne.mockResolvedValue(null);
    Parent.create.mockResolvedValue({ ...VALID_PARENT, preferred_language: 'en', is_verified: false });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+2348098765432', full_name: 'New User', password: 'test1234' });

    expect(res.status).toBe(201);
    expect(smsSvc.sendOtp).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'en');
  });
});

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/verify-otp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: verifies correct OTP and clears cache', async () => {
    redis.getCache.mockResolvedValue('654321');
    Parent.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+2348012345678', otp: '654321' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified/i);
    expect(Parent.update).toHaveBeenCalledWith({ is_verified: true }, expect.any(Object));
    expect(redis.delCache).toHaveBeenCalledWith('otp:+2348012345678');
  });

  it('400: rejects wrong OTP', async () => {
    redis.getCache.mockResolvedValue('654321');

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+2348012345678', otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid or expired/i);
    expect(Parent.update).not.toHaveBeenCalled();
  });

  it('400: rejects expired OTP (null from Redis)', async () => {
    redis.getCache.mockResolvedValue(null);   // expired

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+2348012345678', otp: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid or expired/i);
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: returns tokens for valid credentials', async () => {
    const parent = { ...VALID_PARENT, validatePassword: jest.fn().mockResolvedValue(true) };
    Parent.findOne.mockResolvedValue(parent);
    Parent.update.mockResolvedValue([1]);
    redis.setCache.mockResolvedValue('OK');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348012345678', password: 'test1234' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock-access-token');
    expect(res.body.refreshToken).toBe('mock-refresh-token');
    expect(res.body.parent.phone).toBe('+2348012345678');
    expect(res.body.parent.preferred_language).toBe('yo');
    expect(redis.setCache).toHaveBeenCalledWith(
      'refresh:test-uuid-123', 'mock-refresh-token', expect.any(Number)
    );
  });

  it('401: rejects wrong password', async () => {
    const parent = { ...VALID_PARENT, validatePassword: jest.fn().mockResolvedValue(false) };
    Parent.findOne.mockResolvedValue(parent);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348012345678', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });

  it('401: rejects unknown phone', async () => {
    Parent.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2349999999999', password: 'test1234' });

    expect(res.status).toBe(401);
  });

  it('403: rejects unverified account', async () => {
    const parent = { ...VALID_PARENT, is_verified: false, validatePassword: jest.fn().mockResolvedValue(true) };
    Parent.findOne.mockResolvedValue(parent);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348012345678', password: 'test1234' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verify/i);
  });

  it('401: rejects inactive account', async () => {
    Parent.findOne.mockResolvedValue(null);  // is_active=false filtered by WHERE clause

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348012345678', password: 'test1234' });

    expect(res.status).toBe(401);
  });
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: returns new tokens for valid refresh token', async () => {
    redis.getCache.mockResolvedValue('mock-refresh-token');

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'mock-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock-access-token');
    expect(res.body.refreshToken).toBe('mock-refresh-token');
  });

  it('401: rejects refresh token not in Redis (rotated or expired)', async () => {
    redis.getCache.mockResolvedValue('different-stored-token');  // mismatch

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'mock-refresh-token' });

    expect(res.status).toBe(401);
  });
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: blacklists token and clears refresh', async () => {
    // Valid token verified by auth middleware
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer mock-access-token');

    expect(res.status).toBe(200);
    expect(redis.setCache).toHaveBeenCalledWith(
      'blacklist:mock-access-token', '1', expect.any(Number)
    );
    expect(redis.delCache).toHaveBeenCalledWith('refresh:test-parent-id');
  });

  it('401: rejects request without Authorization header', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ── GET ME ────────────────────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: returns parent profile without password_hash', async () => {
    Parent.findByPk.mockResolvedValue({
      id: 'test-parent-id',
      full_name: 'Mrs. Folake Adeyemi',
      phone: '+2348012345678',
      preferred_language: 'yo',
      subscription_plan: 'basic',
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer mock-access-token');

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+2348012345678');
    expect(res.body.password_hash).toBeUndefined();
    expect(res.body.preferred_language).toBe('yo');
  });
});
