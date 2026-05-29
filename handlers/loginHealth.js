const http = require('http');

const LOGIN_MODES = [
  {
    mode: 'huggingface',
    port: 3003,
    healthPath: '/health',
    description: 'Hugging Face proxy'
  },
  {
    mode: 'ollamacloud',
    port: 3004,
    healthPath: '/health',
    description: 'Ollama Cloud proxy'
  },
  {
    mode: 'ollamalocal',
    port: 3005,
    healthPath: '/health',
    description: 'Ollama Local proxy'
  }
];

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
    LOGIN_MODES.map(async (loginMode) => ({
      ...loginMode,
      available: await checkHttpHealth(loginMode)
    }))
  );

  results.forEach(({ mode, port, healthPath, description, available }) => {
    const status = available ? 'available' : 'unavailable';
    const marker = available ? '✓' : '✗';
    console.log(`${marker} ${mode.padEnd(12)} ${status}`);
    console.log(`  - ${description}`);
    console.log(`  - http://localhost:${port}${healthPath}`);
  });
}

module.exports = {
  LOGIN_MODES,
  checkHttpHealth,
  checkLoginHealth
};
