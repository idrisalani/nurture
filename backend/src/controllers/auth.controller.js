const bcrypt = require('bcryptjs');
const { generateTokens, verifyRefresh } = require('../config/jwt.config');
const { setCache, delCache, getCache } = require('../config/redis.config');
const { sequelize } = require('../config/db.config');
const Parent = require('../models/Parent.model');
const smsSvc = require('../services/sms.service');

const OTP_TTL = 600; // 10 minutes

exports.register = async (req, res) => {
  try {
    const { phone, full_name, password, preferred_language = 'en' } = req.body;
    const exists = await Parent.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ error: 'Phone number already registered' });
    const parent = await Parent.create({ phone, full_name, password_hash: password, preferred_language });
    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await setCache(`otp:${phone}`, otp, OTP_TTL);
    await smsSvc.sendOtp(phone, otp, preferred_language);
    res.status(201).json({ message: 'Registration successful. Check your phone for OTP.', parent_id: parent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const storedOtp = await getCache(`otp:${phone}`);
    if (!storedOtp || storedOtp !== otp) return res.status(400).json({ error: 'Invalid or expired OTP' });
    await Parent.update({ is_verified: true }, { where: { phone } });
    await delCache(`otp:${phone}`);
    res.json({ message: 'Phone verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const parent = await Parent.findOne({ where: { phone, is_active: true } });
    if (!parent) return res.status(401).json({ error: 'Invalid credentials' });
    if (!parent.is_verified) return res.status(403).json({ error: 'Please verify your phone first' });
    const valid = await parent.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const tokens = generateTokens(parent.id);
    await setCache(`refresh:${parent.id}`, tokens.refreshToken, 7 * 24 * 3600);
    await Parent.update({ last_login_at: new Date() }, { where: { id: parent.id } });
    res.json({ ...tokens, parent: { id: parent.id, full_name: parent.full_name, phone: parent.phone, preferred_language: parent.preferred_language, subscription_plan: parent.subscription_plan } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const decoded = verifyRefresh(refresh_token);
    const stored = await getCache(`refresh:${decoded.parentId}`);
    if (!stored || stored !== refresh_token) return res.status(401).json({ error: 'Invalid refresh token' });
    const tokens = generateTokens(decoded.parentId);
    await setCache(`refresh:${decoded.parentId}`, tokens.refreshToken, 7 * 24 * 3600);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  await setCache(`blacklist:${req.token}`, '1', 15 * 60);
  await delCache(`refresh:${req.parentId}`);
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  const parent = await Parent.findByPk(req.parentId, { attributes: { exclude: ['password_hash'] } });
  res.json(parent);
};

exports.updateProfile = async (req, res) => {
  const { full_name, preferred_language } = req.body;
  await Parent.update({ full_name, preferred_language }, { where: { id: req.parentId } });
  res.json({ message: 'Profile updated' });
};

exports.forgotPin = async (req, res) => {
  const { phone } = req.body;
  const parent = await Parent.findOne({ where: { phone } });
  if (!parent) return res.status(404).json({ error: 'Phone not found' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await setCache(`reset:${phone}`, otp, OTP_TTL);
  await smsSvc.sendOtp(phone, otp, parent.preferred_language);
  res.json({ message: 'Reset OTP sent' });
};
