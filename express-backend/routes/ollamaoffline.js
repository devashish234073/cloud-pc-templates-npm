const express = require('express');
const http = require('http');
const { exec } = require('child_process');
const { requireEnabled } = require('./routeState');

const router = express.Router();
router.use(requireEnabled('ollamaoffline'));

function localRequest(upstreamPath, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({ hostname: 'localhost', port: 11434, path: upstreamPath, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve(data); } });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

router.get('/v1/models', (req, res, next) => {
  exec('ollama list', (error, stdout) => {
    if (error) return next(error);
    const data = stdout.split('\n').slice(1).map(line => line.trim()).filter(Boolean).map(line => line.split(/\s{2,}/)[0]).filter(Boolean).filter(name => name !== '-').map(name => ({ id: name, object: 'model', owned_by: 'ollama' }));
    res.json({ object: 'list', data });
  });
});

router.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const body = { model: req.body.model, messages: req.body.messages, temperature: req.body.temperature, top_p: req.body.top_p, think: false, stream: req.body.stream === true };
    if (req.body.stream === true) {
      const payload = JSON.stringify(body);
      const upstreamReq = http.request({ hostname: 'localhost', port: 11434, path: '/api/chat', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, upstreamRes => {
        res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        let buffer = '';
        upstreamRes.on('data', chunk => {
          buffer += chunk.toString();
          const lines = buffer.split('\n'); buffer = lines.pop();
          lines.filter(line => line.trim()).forEach(line => {
            try {
              const ollamaChunk = JSON.parse(line);
              const content = ollamaChunk.message?.content || '';
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
    const result = await localRequest('/api/chat', body);
    res.json({ id: String(Date.now()), object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: req.body.model, choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: result?.message?.content || '' } }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
  } catch (error) { next(error); }
});

router.post('/v1/systemone', async (req, res, next) => {
  try { res.json(await localRequest('/v1/systemone', req.body)); } catch (error) { next(error); }
});
router.get('/health', (req, res) => res.json({ status: 'UP', mode: 'ollama-local' }));
module.exports = router;
