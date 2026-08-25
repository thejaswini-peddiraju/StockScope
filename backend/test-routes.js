const http = require('http');
const { createApp } = require('./src/server');

const app = createApp();
const server = app.listen(0, async () => {
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const get = (path) =>
    new Promise((resolve, reject) => {
      http
        .get(base + path, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, json: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        })
        .on('error', reject);
    });

  try {
    console.log('=== /api/health ===');
    console.log(JSON.stringify((await get('/api/health')).json, null, 2));

    console.log('\n=== /api/stocks/search?q=reliance ===');
    console.log(JSON.stringify((await get('/api/stocks/search?q=reliance')).json, null, 2));

    console.log('\n=== /api/stocks/quote/RELIANCE.BSE ===');
    console.log(JSON.stringify((await get('/api/stocks/quote/RELIANCE.BSE')).json, null, 2));

    console.log('\n=== /api/stocks/history/AAPL (summary) ===');
    const hist = (await get('/api/stocks/history/AAPL')).json;
    console.log('source:', hist.source, '| points:', hist.history.length);
    console.log('first 3:', JSON.stringify(hist.history.slice(0, 3), null, 2));

    console.log('\n=== /api/stocks/quote/UNKNOWNXYZ (should now succeed via synthetic fallback) ===');
    const bad = await get('/api/stocks/quote/UNKNOWNXYZ');
    console.log('status:', bad.status, JSON.stringify(bad.json));

    // --- Auth + watchlist flow ---
    const post = (path, body) =>
      new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request(
          base + path,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
          },
          (res) => {
            let out = '';
            res.on('data', (c) => (out += c));
            res.on('end', () => {
              try { resolve({ status: res.statusCode, json: JSON.parse(out) }); }
              catch (e) { resolve({ status: res.statusCode, raw: out }); }
            });
          }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });

    const authGet = (path, token) =>
      new Promise((resolve, reject) => {
        http
          .get(base + path, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
            let out = '';
            res.on('data', (c) => (out += c));
            res.on('end', () => {
              try { resolve({ status: res.statusCode, json: JSON.parse(out) }); }
              catch (e) { resolve({ status: res.statusCode, raw: out }); }
            });
          })
          .on('error', reject);
      });

    const authPost = (path, body, token) =>
      new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request(
          base + path,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              Authorization: `Bearer ${token}`,
            },
          },
          (res) => {
            let out = '';
            res.on('data', (c) => (out += c));
            res.on('end', () => {
              try { resolve({ status: res.statusCode, json: JSON.parse(out) }); }
              catch (e) { resolve({ status: res.statusCode, raw: out }); }
            });
          }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });

    const testEmail = `test${Date.now()}@example.com`;

    console.log('\n=== POST /api/auth/register ===');
    const reg = await post('/api/auth/register', { name: 'Test User', email: testEmail, password: 'password123' });
    console.log('status:', reg.status, JSON.stringify(reg.json));

    console.log('\n=== POST /api/auth/register (duplicate, should 409) ===');
    const dupe = await post('/api/auth/register', { name: 'Test User', email: testEmail, password: 'password123' });
    console.log('status:', dupe.status, JSON.stringify(dupe.json));

    console.log('\n=== POST /api/auth/login (wrong password, should 401) ===');
    const badLogin = await post('/api/auth/login', { email: testEmail, password: 'wrongpass' });
    console.log('status:', badLogin.status, JSON.stringify(badLogin.json));

    console.log('\n=== POST /api/auth/login (correct) ===');
    const login = await post('/api/auth/login', { email: testEmail, password: 'password123' });
    console.log('status:', login.status, JSON.stringify(login.json));
    const token = login.json.token;

    console.log('\n=== GET /api/auth/me (with token) ===');
    console.log(JSON.stringify((await authGet('/api/auth/me', token)).json));

    console.log('\n=== GET /api/watchlist (no token, should 401) ===');
    const noAuth = await get('/api/watchlist');
    console.log('status:', noAuth.status, JSON.stringify(noAuth.json));

    console.log('\n=== POST /api/watchlist (add RELIANCE.BSE) ===');
    console.log(JSON.stringify((await authPost('/api/watchlist', { symbol: 'RELIANCE.BSE' }, token)).json));

    console.log('\n=== GET /api/watchlist (with token) ===');
    console.log(JSON.stringify((await authGet('/api/watchlist', token)).json));

    console.log('\nAll routes responded successfully.');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
