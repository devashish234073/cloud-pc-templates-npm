const express = require('express');
const https = require('https');
const { routes, requireEnabled } = require('./routeState');

const router = express.Router();
router.use(requireEnabled('sarvam'));

const models = { object: 'list', data: [{ id: 'sarvam-105b', object: 'model' }, { id: 'sarvam-30b', object: 'model' }] };

router.get('/v1/models', (req, res) => res.json(models));
router.post('/v1/chat/completions', (req, res, next) => {
  const body = { ...req.body, reasoning_effort: null };
  const payload = JSON.stringify(body);
  const upstreamReq = https.request({
    hostname: 'api.sarvam.ai', path: '/v1/chat/completions', method: 'POST',
    headers: { Authorization: `Bearer ${routes.sarvam.apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, upstreamRes => {
    if (body.stream === true && upstreamRes.statusCode < 400) {
      res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      return upstreamRes.pipe(res);
    }
    let data = ''; upstreamRes.on('data', chunk => data += chunk);
    upstreamRes.on('end', () => {
      let parsed; try { parsed = JSON.parse(data); } catch { parsed = data; }
      if (upstreamRes.statusCode >= 400 && typeof parsed === 'object') res.set('X-Ollama-Error', parsed?.error?.message || `Sarvam error (HTTP ${upstreamRes.statusCode})`);
      res.status(upstreamRes.statusCode).json(parsed);
    });
  });
  upstreamReq.on('error', next); upstreamReq.write(payload); upstreamReq.end();
});
router.get('/health', (req, res) => res.json({ status: 'UP', vendor: 'sarvam' }));
module.exports = router;
