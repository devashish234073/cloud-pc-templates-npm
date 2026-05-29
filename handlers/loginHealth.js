const http = require('http');
const { getEndpoint, getLoginModes } = require('./loginModes');

function checkHttpHealth({ port, healthPath }, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const request = http.request(
      {
        hostname: 'localhost',
        port,
        path: healthPath,
        method: 'GET',
        timeout: timeoutMs
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => {
      resolve(false);
    });

    request.end();
  });
}

async function checkLoginHealth() {
  console.log('AI login health');
  console.log('');

  const results = await Promise.all(
    getLoginModes().map(async (loginMode) => ({
      ...loginMode,
      available: await checkHttpHealth(loginMode)
    }))
  );

  results.forEach((loginMode) => {
    const { mode, description, available } = loginMode;
    const status = available ? 'available' : 'unavailable';
    const marker = available ? '✓' : '✗';
    console.log(`${marker} ${mode.padEnd(12)} ${status}`);
    console.log(`  - ${description}`);
    console.log(`  - ${getEndpoint(loginMode, 'healthPath')}`);
  });
}

module.exports = {
  checkHttpHealth,
  checkLoginHealth
};
