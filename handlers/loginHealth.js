const http = require('http');
const { getEndpoint, getLoginModes } = require('./loginModes');
const { colorize } = require('../utils/terminalUtils');

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

function visibleLength(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '').length;
}

function padVisible(text, width) {
  return text + ' '.repeat(Math.max(0, width - visibleLength(text)));
}

function printHealthTable(results) {
  const columns = [
    { title: 'Mode', key: 'mode' },
    { title: 'Status', key: 'status' },
    { title: 'Description', key: 'description' },
    { title: 'Health Endpoint', key: 'endpoint' }
  ];
  const rows = results.map((loginMode) => {
    const status = loginMode.available ? '✓ available' : '✗ unavailable';

    return {
      mode: loginMode.mode,
      status,
      description: loginMode.description,
      endpoint: getEndpoint(loginMode, 'healthPath'),
      available: loginMode.available
    };
  });
  const widths = columns.map((column) => (
    Math.max(
      column.title.length,
      ...rows.map((row) => row[column.key].length)
    )
  ));
  const separator = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
  const formatRow = (values) => `| ${values.map((value, index) => padVisible(value, widths[index])).join(' | ')} |`;

  console.log(separator);
  console.log(formatRow(columns.map((column) => colorize(column.title, '1'))));
  console.log(separator);

  rows.forEach((row) => {
    const statusColor = row.available ? '32' : '31';

    console.log(formatRow([
      row.mode,
      colorize(row.status, statusColor),
      row.description,
      row.endpoint
    ]));
  });

  console.log(separator);
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

  printHealthTable(results);
}

module.exports = {
  checkHttpHealth,
  checkLoginHealth
};
