const express = require('express');
const https = require('https');
const { routes, requireEnabled } = require('./routeState');

const router = express.Router();
router.use(requireEnabled('ollama'));

function request(method, upstreamPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname: 'ollama.com', path: upstreamPath, method, headers: { Authorization: `Bearer ${routes.ollama.apiKey}`, 'Content-Type': 'application/json', ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) } }, res => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}

router.get('/v1/models', async (req, res, next) => {
  try {
    const result = await request('GET', '/api/tags');
    const source = result.body?.models || [];
    res.status(result.status).json({ object: 'list', data: source.map(model => ({ id: model.name, object: 'model', created: Math.floor(new Date(model.modified_at).getTime() / 1000), owned_by: 'ollama' })) });
  } catch (error) { next(error); }
});

router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const body = { model: req.body.model, messages: req.body.messages, temperature: req.body.temperature, top_p: req.body.top_p, stream: req.body.stream === true, think: false };
    if (req.body.stream === true) {
      const payload = JSON.stringify(body);
      const upstreamReq = https.request({ hostname: 'ollama.com', path: '/api/chat', method: 'POST', headers: { Authorization: `Bearer ${routes.ollama.apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, upstreamRes => {
        res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        let buffer = '';
        upstreamRes.on('data', chunk => {
          buffer += chunk.toString();
          const lines = buffer.split('\n'); buffer = lines.pop();
          lines.filter(line => line.trim()).forEach(line => {
            try {
              const ollamaChunk = JSON.parse(line);
              const content = ollamaChunk.message?.content || '';
              if (ollamaChunk.error) { res.write(`data: ${JSON.stringify({ error: ollamaChunk.error })}\n\n`); return; }
              if (content) res.write(`data: ${JSON.stringify({ id: String(Date.now()), object: 'chat.completion.chunk', model: req.body.model, choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`);
              if (ollamaChunk.done) res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`);
            } catch {}
          });
        });
        upstreamRes.on('end', () => { res.write('data: [DONE]\n\n'); res.end(); });
      });
      upstreamReq.on('error', error => next(error)); upstreamReq.write(payload); upstreamReq.end();
      return;
    }
    const result = await request('POST', '/api/chat', body);
    const content = result.body?.message?.content || result.body?.choices?.[0]?.message?.content || '';
    res.status(result.status).json({ id: String(Date.now()), object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: req.body.model, choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content, reasoning_content: result.body?.message?.thinking || '' } }], usage: result.body?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
  } catch (error) { next(error); }
});

router.post(['/v1/web_search', '/api/web_search'], async (req, res, next) => {
  if (!req.body.query) return res.status(400).json({ error: "Missing query parameter 'query'" });
  try { const result = await request('POST', '/api/web_search', req.body); res.status(result.status).json(result.body); } catch (error) { next(error); }
});
router.get('/health', (req, res) => res.json({ status: 'UP', vendor: 'ollama-cloud' }));
router.get('/v1/web_search/health', (req, res) => res.json({ status: 'running', vendor: 'ollama-cloud' }));
module.exports = router;
