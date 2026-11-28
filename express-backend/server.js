const path = require('path');
const express = require('express');
const routeState = require('./routes/routeState');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const pidFile = path.join(__dirname, '.server.pid');

app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/deepseek', require('./routes/deepseek'));
app.use('/huggingface', require('./routes/huggingface'));
app.use('/sarvam', require('./routes/sarvam'));
app.use('/ollama', require('./routes/ollama'));
app.use('/ollamaoffline', require('./routes/ollamaoffline'));

app.get('/api/routes/status', (req, res) => {
  res.json({ routes: routeState.getAllStatus() });
});

app.post('/api/routes/:id/enable', (req, res) => {
  const id = req.params.id;
  if (!routeState.routes[id]) return res.status(404).json({ error: 'Unknown route' });
  try {
    const route = routeState.enable(id, req.body.apiKey);
    res.json({ ok: true, route: routeState.getStatus(id) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/routes/:id/disable', (req, res) => {
  const id = req.params.id;
  if (!routeState.routes[id]) return res.status(404).json({ error: 'Unknown route' });
  routeState.disable(id);
  res.json({ ok: true, route: routeState.getStatus(id) });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Proxy request failed', details: error.message });
});

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

const server = app.listen(PORT, () => {
  fs.writeFileSync(pidFile, String(process.pid));
  console.log(`Unified proxy server running at http://localhost:${PORT}`);
  console.log('All routes start OFF. Use / or /api/routes/status to manage them.');
  console.log('Press Ctrl+C or run npm run stop to stop the server.');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(() => {
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
    console.log('Server stopped.');
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 5000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

process.once('exit', () => {
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
});
