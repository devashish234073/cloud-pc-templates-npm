const express = require('express');
const https = require('https');
const { routes, requireEnabled } = require('./routeState');

const router = express.Router();
router.use(requireEnabled('deepseek'));

function upstream(method, upstreamPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.deepseek.com', path: upstreamPath, method,
      headers: { Authorization: `Bearer ${routes.deepseek.apiKey}`, 'Content-Type': 'application/json', ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data || '{}'), headers: res.headers }); } catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

router.get('/v1/models', async (req, res, next) => {
  try { const result = await upstream('GET', '/models'); res.status(result.status).json(result.body); } catch (error) { next(error); }
});

router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    if (!req.body.stream) {
      const result = await upstream('POST', '/chat/completions', req.body);
      if (result.status >= 400) res.set('X-Ollama-Error', result.body?.error?.message || `DeepSeek error (HTTP ${result.status})`);
      return res.status(result.status).json(result.body);
    }
    const payload = JSON.stringify(req.body);
    const upstreamReq = https.request({
      hostname: 'api.deepseek.com', path: '/chat/completions', method: 'POST',
      headers: { Authorization: `Bearer ${routes.deepseek.apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, upstreamRes => {
      if (upstreamRes.statusCode >= 400) {
        let data = ''; upstreamRes.on('data', c => data += c);
        upstreamRes.on('end', () => {
          let message = `DeepSeek error (HTTP ${upstreamRes.statusCode})`; try { const e = JSON.parse(data); message = e?.error?.message || message; } catch {}
          res.status(200).set({ 'Content-Type': 'text/event-stream', 'X-Ollama-Error': message }); res.write('data: [DONE]\n\n'); res.end();
        }); return;
      }
      res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }); upstreamRes.pipe(res);
    });
    upstreamReq.on('error', error => res.end(`data: ${JSON.stringify({ error: error.message })}\n\n`));
    upstreamReq.write(payload); upstreamReq.end();
  } catch (error) { next(error); }
});

router.get('/health', (req, res) => res.json({ status: 'UP', vendor: 'deepseek' }));
module.exports = router;
