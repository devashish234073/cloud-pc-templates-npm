const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'public', 'llm.log');

function initialize() {
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '', { encoding: 'utf8' });
}

function append(entry) {
  const line = `${JSON.stringify({ ...entry, timestamp: new Date().toISOString() })}\n`;
  fs.appendFile(logFile, line, error => {
    if (error) console.error('Could not write LLM log:', error.message);
  });
}

function read() {
  return fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
}

function captureLlmTraffic(req, res, next) {
  const isChatCall = req.method === 'POST' && (
    req.path.includes('/chat/completions') ||
    req.path.includes('/web_search') ||
    req.path.includes('/systemone')
  );

  if (!isChatCall) return next();

  const provider = req.originalUrl.split('/').filter(Boolean)[0] || 'unknown';
  const chunks = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = (chunk, encoding, callback) => {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    chunks.push(Buffer.isBuffer(chunk) ? chunk.toString(typeof encoding === 'string' ? encoding : 'utf8') : String(chunk));
    return originalWrite(chunk, encoding, callback);
  };

  res.end = (chunk, encoding, callback) => {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = undefined;
    } else if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk.toString(typeof encoding === 'string' ? encoding : 'utf8') : String(chunk));
    }
    return originalEnd(chunk, encoding, callback);
  };

  res.once('finish', () => {
    append({
      provider,
      method: req.method,
      path: req.originalUrl,
      request: req.body,
      status: res.statusCode,
      response: chunks.length ? chunks.join('') : undefined
    });
  });

  next();
}

module.exports = { initialize, append, read, captureLlmTraffic, logFile };
