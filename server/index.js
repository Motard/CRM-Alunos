const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const yearsRouter = require('./routes/years');
const pupilsRouter = require('./routes/pupils');
const enrollmentsRouter = require('./routes/enrollments');
const absencesRouter = require('./routes/absences');
const closuresRouter = require('./routes/closures');
const notesRouter = require('./routes/notes');
const reportRouter = require('./routes/report');

const app = express();

app.use(cors());
app.use(express.json());

// --- Sessions ---
const sessions = new Set();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  if (!sessions.has(auth.slice(7))) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// --- Login rate limiting (global, in-memory) ---
const BASE_LOCKOUT_MS = 10 * 60 * 1000;
const rateLimit = { failures: 0, lockoutStart: null, lockoutDuration: null };

function isLocked() {
  if (!rateLimit.lockoutStart) return false;
  return Date.now() < rateLimit.lockoutStart + rateLimit.lockoutDuration;
}

function lockedUntil() {
  return rateLimit.lockoutStart + rateLimit.lockoutDuration;
}

function recordFailure() {
  rateLimit.failures++;
  if (rateLimit.failures % 5 === 0) {
    const tier = rateLimit.failures / 5;
    rateLimit.lockoutStart = Date.now();
    rateLimit.lockoutDuration = BASE_LOCKOUT_MS * Math.pow(2, tier - 1);
  }
}

const LOG_FILE = path.join(__dirname, 'login-attempts.log');

function logAttempt(ip, success, reason, lockedUntilISO) {
  const data = { date: new Date().toISOString(), ip, success, reason };
  if (lockedUntilISO) data.lockedUntil = lockedUntilISO;
  fs.appendFile(LOG_FILE, JSON.stringify(data) + '\n', () => {});
}

app.post('/api/login', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;

  if (isLocked()) {
    logAttempt(ip, false, 'locked');
    return res.status(429).json({ lockedUntil: lockedUntil() });
  }

  const { code } = req.body || {};
  const password = process.env.LOGIN_PASSWORD;

  if (!password) {
    return res.status(500).json({ error: 'Server misconfigured: LOGIN_PASSWORD not set' });
  }

  const codeOk = code.length === password.length &&
    crypto.timingSafeEqual(Buffer.from(code), Buffer.from(password));

  if (codeOk) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.add(token);
    logAttempt(ip, true, 'ok');
    return res.json({ token });
  }

  recordFailure();
  logAttempt(ip, false, 'wrong_password');

  if (isLocked()) {
    logAttempt(ip, false, 'access_locked', new Date(lockedUntil()).toISOString());
    return res.status(429).json({ lockedUntil: lockedUntil() });
  }

  return res.status(401).json({ error: 'unauthorized' });
});

app.use('/api/years', requireAuth, yearsRouter);
app.use('/api/pupils', requireAuth, pupilsRouter);
app.use('/api/years/:yearId/pupils', requireAuth, enrollmentsRouter);
app.use('/api/years/:yearId/pupils/:pupilId/absences', requireAuth, absencesRouter);
app.use('/api/years/:yearId/absences', requireAuth, absencesRouter);
app.use('/api/years/:yearId/closures', requireAuth, closuresRouter);
app.use('/api/years/:yearId/notes', requireAuth, notesRouter);
app.use('/api/years/:yearId/report', requireAuth, reportRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
