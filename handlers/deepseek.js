const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

function promptForApiKey() {
  return new Promise((resolve) => {
    process.stdout.write('Enter DeepSeek API Key: ');
    const stdin = process.stdin;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    let apiKey = '';
    stdin.on('data', (buffer) => {
      const chunk = buffer.toString();
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        if (char === '\n' || char === '\r' || char === '\u0004') {
          if (stdin.isTTY) stdin.setRawMode(false);
          stdin.pause();
          stdin.removeAllListeners('data');
          console.log('');
          resolve(apiKey);
          return;
        } else if (char === '\u0003') {
          if (stdin.isTTY) stdin.setRawMode(false);
          process.exit();
        } else if (char === '\x7f' || char === '\b') {
          if (apiKey.length > 0) { apiKey = apiKey.slice(0, -1); process.stdout.write('\x1b[D\x1b[K'); }
        } else if (char >= '\x20' && char <= '\x7e') {
          apiKey += char;
          process.stdout.write('*');
        }
      }
    });
  });
}

function checkHealthEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint);
    const protocol = url.protocol === 'https:' ? https : http;
    const request = protocol.request(url, { method: 'GET' }, (res) => resolve(res.statusCode === 200));
    request.on('error', () => resolve(false));
    request.end();
  });
}

async function downloadAndRunProxy(endpoint) {
  const url = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-PROXIES/deepseek-proxy.js';
  const tempFile = path.join(os.tmpdir(), 'deepseek-proxy.js');

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tempFile);
    https.get(url, (res) => { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }).on('error', reject);
  });

  const apiKey = await promptForApiKey();

  return new Promise((resolve, reject) => {
    const child = spawn('node', [tempFile, apiKey]);
    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.error(data.toString()));
    setTimeout(async () => {
      try {
        const isHealthy = await checkHealthEndpoint(endpoint);
        if (isHealthy) {
          console.log('✓ Logged in');
          console.log(`  - Endpoint checked: ${endpoint}`);
        } else {
          console.log('✓ Proxy started');
          console.log(`  - Endpoint: ${endpoint}`);
        }
        resolve();
      } catch (error) { reject(error); }
    }, 2000);
    child.on('error', reject);
  });
}

async function checkAndLoginDeepSeek() {
  const endpoint = 'http://localhost:3006/health';
  try {
    const isHealthy = await checkHealthEndpoint(endpoint);
    if (isHealthy) {
      console.log('✓ Already logged in');
      console.log(`  - Endpoint checked: ${endpoint}`);
      return;
    }
    await downloadAndRunProxy(endpoint);
  } catch (error) {
    console.error('Error during login:', error.message);
  }
}

module.exports = { checkAndLoginDeepSeek, checkHealthEndpoint, downloadAndRunProxy, promptForApiKey };
