const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SESSION_TTL = 8 * 60 * 60 * 1000;
const sessions = new Map();
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

function hashPassword(password, salt = 'acredita-local-salt') {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function createInitialStore() {
  return {
    users: [
      { id: 'usr-admin', name: 'Lucía M.', email: process.env.ADMIN_EMAIL || 'admin@acredita.local', role: 'admin', passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'admin-demo-2026') },
      { id: 'usr-staff', name: 'Usuario de puerta', email: process.env.STAFF_EMAIL || 'puerta@acredita.local', role: 'staff', passwordHash: hashPassword(process.env.STAFF_PASSWORD || 'puerta-demo-2026') }
    ],
    events: []
  };
}

function loadStore() {
  if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const store = createInitialStore();
  if (!process.env.VERCEL) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  }
  return store;
}

const store = loadStore();
function saveStore() {
  if (!process.env.VERCEL) fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
function parseCookies(request) { return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map(value => { const [key, ...rest] = value.trim().split('='); return [key, decodeURIComponent(rest.join('='))]; })); }
function getSessionUser(request) {
  const token = parseCookies(request).acredita_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  return store.users.find(user => user.id === session.userId) || null;
}
function sendJson(response, status, body, extraHeaders = {}) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders }); response.end(JSON.stringify(body)); }
function readBody(request) { return new Promise((resolve, reject) => { let body = ''; request.on('data', chunk => { body += chunk; if (body.length > 1e6) request.destroy(); }); request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('JSON inválido')); } }); request.on('error', reject); }); }
function requireUser(request, response, role) { const user = getSessionUser(request); if (!user) { sendJson(response, 401, { error: 'auth_required' }); return null; } if (role && user.role !== role) { sendJson(response, 403, { error: 'forbidden' }); return null; } return user; }

async function handleApi(request, response, url) {
  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    try {
      const body = await readBody(request);
      const user = store.users.find(candidate => candidate.email.toLowerCase() === String(body.email || '').toLowerCase());
      if (!user || hashPassword(String(body.password || '')) !== user.passwordHash) return sendJson(response, 401, { error: 'invalid_credentials' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL });
      return sendJson(response, 200, { user: publicUser(user) }, { 'Set-Cookie': `acredita_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}` });
    } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
  }
  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = getSessionUser(request);
    return sendJson(response, user ? 200 : 401, user ? { user: publicUser(user) } : { error: 'auth_required' });
  }
  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = parseCookies(request).acredita_session; if (token) sessions.delete(token);
    return sendJson(response, 200, { ok: true }, { 'Set-Cookie': 'acredita_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }
  if (request.method === 'GET' && url.pathname === '/api/events') {
    const user = requireUser(request, response); if (!user) return;
    const events = user.role === 'admin' ? store.events.filter(event => event.ownerId === user.id) : store.events.filter(event => event.staffIds.includes(user.id));
    return sendJson(response, 200, { events });
  }
  if (request.method === 'POST' && url.pathname === '/api/events') {
    const user = requireUser(request, response, 'admin'); if (!user) return;
    try {
      const body = await readBody(request);
      if (!body.name || !body.venue || !body.startsAt || !Number(body.capacity)) return sendJson(response, 422, { error: 'missing_event_fields' });
      const event = { id: `evt-${crypto.randomUUID()}`, ownerId: user.id, name: body.name, venue: body.venue, city: body.city || '', startsAt: body.startsAt, capacity: Number(body.capacity), ticketTypes: Array.isArray(body.ticketTypes) ? body.ticketTypes : [], staffIds: ['usr-staff'], createdAt: new Date().toISOString() };
      store.events.push(event); saveStore(); return sendJson(response, 201, { event });
    } catch { return sendJson(response, 400, { error: 'invalid_request' }); }
  }
  return sendJson(response, 404, { error: 'not_found' });
}

function serveStatic(request, response, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { response.writeHead(404); return response.end('Not found'); }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const requestHandler = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(request, response, url);
  return serveStatic(request, response, url);
};

if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => console.log(`Acredita disponible en http://localhost:${PORT}`));
}

module.exports = requestHandler;
