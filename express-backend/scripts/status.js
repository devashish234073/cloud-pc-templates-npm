const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '..', '.server.pid');

if (!fs.existsSync(pidFile)) {
  console.log('OFF: proxy server is not running');
  process.exit(0);
}

const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());

try {
  process.kill(pid, 0);
  console.log(`ON: proxy server is running (PID ${pid})`);
} catch (error) {
  fs.unlinkSync(pidFile);
  console.log('OFF: proxy server is not running');
}
