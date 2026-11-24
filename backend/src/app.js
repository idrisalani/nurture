const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
// Render (and nginx) terminate TLS in front of the app; trust one proxy hop so rate limiting sees real client IPs.
app.set('trust proxy', 1);

// ── Security middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ── Global rate limiter ────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/children',   require('./routes/children.routes'));
app.use('/api/v1/screentime', require('./routes/screentime.routes'));
app.use('/api/v1/filter',     require('./routes/filter.routes'));
app.use('/api/v1/location',   require('./routes/location.routes'));
app.use('/api/v1/social',     require('./routes/social.routes'));
app.use('/api/v1/reports',    require('./routes/reports.routes'));
app.use('/api/v1/routines',   require('./routes/routines.routes'));
app.use('/api/v1/prayer',     require('./routes/prayer.routes'));
app.use('/api/v1/exam',       require('./routes/exammode.routes'));
app.use('/api/v1/panic',      require('./routes/panic.routes'));
app.use('/api/v1/ai',         require('./routes/ai.routes'));
app.use('/api/v1/payments',   require('./routes/payments.routes'));
app.use('/api/v1/alerts',     require('./routes/alerts.routes'));
app.use('/api/v1/insights',   require('./routes/insights.routes'));
app.use('/api/v1/devices',    require('./routes/devices.routes'));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'NurtureNet API', version: '1.0.0' }));

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
