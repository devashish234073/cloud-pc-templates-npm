const express = require('express');
const https = require('https');
const { routes, requireEnabled } = require('./routeState');

const router = express.Router();
router.use(requireEnabled('huggingface'));

function proxy(req, res, next) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const headers = { 'Content-Type': 'application/json' };
    if (req.path === '/v1/chat/completions') headers.Authorization = `Bearer ${routes.huggingface.apiKey}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const upstreamReq = https.request({ hostname: 'router.huggingface.co', path: req.originalUrl.replace(/^\/huggingface/, '') + (req.url.includes('?') ? '' : ''), method: req.method, headers }, upstreamRes => {
      const headersOut = { ...upstreamRes.headers }; delete headersOut['content-encoding'];
      res.status(upstreamRes.statusCode || 200);
      Object.entries(headersOut).forEach(([key, value]) => res.setHeader(key, value));
      upstreamRes.pipe(res);
    });
    upstreamReq.on('error', error => next(error));
    if (body) upstreamReq.write(body);
    upstreamReq.end();
  });
}

router.get('/v1/models', proxy);
router.post('/v1/chat/completions', proxy);
router.get('/health', (req, res) => res.json({ status: 'UP', vendor: 'huggingface' }));
module.exports = router;
