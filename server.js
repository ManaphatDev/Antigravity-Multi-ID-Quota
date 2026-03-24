// Local dev server ที่จำลอง Vercel serverless functions
// ใช้ตอน development เท่านั้น — บน Vercel จะใช้ serverless functions โดยตรง

import 'dotenv/config';
import http from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import handlers
const accountsHandler = await import('./api/accounts/index.js');
const accountByIdHandler = await import('./api/accounts/[id].js');
const refreshHandler = await import('./api/accounts/refresh.js');

const PORT = 3001;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // สร้าง fake res object ที่เข้ากันกับ Vercel handler
  const fakeRes = {
    _statusCode: 200,
    _headers: {},
    _body: null,
    setHeader(key, value) { this._headers[key] = value; },
    status(code) { this._statusCode = code; return this; },
    json(data) { this._body = JSON.stringify(data); return this; },
    end() { this._body = ''; return this; },
  };

  const body = await parseBody(req);
  const fakeReq = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body,
    query: {},
  };

  try {
    if (path === '/api/accounts/refresh' || path === '/api/accounts/refresh/') {
      await refreshHandler.default(fakeReq, fakeRes);
    } else if (path === '/api/accounts' || path === '/api/accounts/') {
      await accountsHandler.default(fakeReq, fakeRes);
    } else if (path.startsWith('/api/accounts/')) {
      const id = path.split('/api/accounts/')[1].replace('/', '');
      fakeReq.query = { id };
      await accountByIdHandler.default(fakeReq, fakeRes);
    } else {
      fakeRes.status(404).json({ error: 'Not found' });
    }

    // ส่ง response จริง
    res.writeHead(fakeRes._statusCode, {
      'Content-Type': 'application/json',
      ...fakeRes._headers,
    });
    res.end(fakeRes._body);

  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 API dev server running at http://localhost:${PORT}`);
  console.log(`   GET  /api/accounts`);
  console.log(`   POST /api/accounts`);
  console.log(`   GET  /api/accounts/:id`);
  console.log(`   PUT  /api/accounts/:id`);
  console.log(`   DELETE /api/accounts/:id`);
  console.log(`   POST /api/accounts/refresh`);
});
