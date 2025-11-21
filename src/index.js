const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const live = io.of('/live');

live.on('connection', (socket) => {
  socket.on('snapshot', (payload) => {
    if (payload && typeof payload === 'object') {
      live.emit('snapshot', { ...payload, ts: Date.now() });
    }
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const sessions = {};
const events = {};
const attendance = {};

const DEV_PW = process.env.DEV_PW || 'password';
const DEV_HASH = bcrypt.hashSync(DEV_PW, 10);
const users = [
  { id: 't1', email: 'teacher@example.com', role: 'teacher', password: DEV_HASH },
  { id: 's1', email: 'student@example.com', role: 'student', password: DEV_HASH },
];

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(t, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

app.post('/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  const u = users.find(x => x.email === email && x.role === role);
  if (!u) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password || '', u.password);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

app.post('/sessions/start', auth, (req, res) => {
  const id = 'sess_' + Date.now();
  const courseId = req.body && req.body.courseId ? req.body.courseId : 'course';
  sessions[id] = { id, courseId, startTs: Date.now(), endTs: null, owner: req.user.id };
  events[id] = [];
  attendance[id] = {};
  res.json({ sessionId: id });
});

app.post('/sessions/end', auth, (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessions[sessionId]) return res.status(404).json({ error: 'not_found' });
  sessions[sessionId].endTs = Date.now();
  res.json({ ok: true });
});

app.post('/analytics/events', auth, (req, res) => {
  const { sessionId, studentId, ts, metrics } = req.body || {};
  if (!sessions[sessionId]) return res.status(404).json({ error: 'not_found' });
  events[sessionId].push({ studentId, ts: ts || Date.now(), metrics });
  res.json({ ok: true });
});

app.post('/attendance/snapshot', auth, (req, res) => {
  const { sessionId, studentId, status, ts } = req.body || {};
  if (!sessions[sessionId]) return res.status(404).json({ error: 'not_found' });
  attendance[sessionId][studentId] = { status: status || 'present', firstSeenTs: attendance[sessionId][studentId]?.firstSeenTs || ts || Date.now(), lastSeenTs: ts || Date.now() };
  res.json({ ok: true });
});

app.get('/analytics/summary', auth, (req, res) => {
  const { sessionId } = req.query || {};
  if (!sessions[sessionId]) return res.status(404).json({ error: 'not_found' });
  const list = events[sessionId] || [];
  const byStudent = {};
  for (const e of list) {
    const a = e.metrics && typeof e.metrics.attention === 'number' ? e.metrics.attention : 0;
    const s = e.metrics && e.metrics.state ? e.metrics.state : 'neutral';
    const x = byStudent[e.studentId] || { sum: 0, count: 0, states: {} };
    x.sum += a;
    x.count += 1;
    x.states[s] = (x.states[s] || 0) + 1;
    byStudent[e.studentId] = x;
  }
  const out = Object.entries(byStudent).map(([studentId, v]) => ({ studentId, attention: v.count ? Math.round(v.sum / v.count) : 0, states: v.states }));
  res.json({ session: sessions[sessionId], summary: out });
});

async function sendMail(to, subject, html) {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || 'noreply@example.com';
  if (!host || !user || !pass) return { skipped: true };
  const transport = nodemailer.createTransport({ host, auth: { user, pass } });
  const info = await transport.sendMail({ from, to, subject, html });
  return { id: info.messageId };
}

app.post('/reports/daily', auth, async (req, res) => {
  const bySess = Object.values(sessions);
  const report = [];
  for (const s of bySess) {
    const list = events[s.id] || [];
    const agg = {};
    for (const e of list) {
      const a = e.metrics && typeof e.metrics.attention === 'number' ? e.metrics.attention : 0;
      const x = agg[e.studentId] || { sum: 0, count: 0 };
      x.sum += a;
      x.count += 1;
      agg[e.studentId] = x;
    }
    const rows = Object.entries(agg).map(([studentId, v]) => ({ studentId, attention: v.count ? Math.round(v.sum / v.count) : 0 }));
    report.push({ sessionId: s.id, courseId: s.courseId, rows });
  }
  const html = JSON.stringify(report);
  let mail = null;
  if (req.user.role === 'teacher') mail = await sendMail(req.user.email, 'Daily Class Report', html);
  res.json({ report, mail });
});

cron.schedule('0 18 * * *', async () => {}, { timezone: 'UTC' });

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`server:${PORT}`);
});