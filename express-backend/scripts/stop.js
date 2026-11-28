const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '..', '.server.pid');

if (!fs.existsSync(pidFile)) {
  console.log('The proxy server is not running.');
  process.exit(0);
}

const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());

if (!Number.isInteger(pid) || pid <= 0) {
  fs.unlinkSync(pidFile);
  console.log('Removed an invalid server PID file.');
  process.exit(0);
}

try {
  process.kill(pid, 'SIGTERM');
  console.log(`Stop signal sent to proxy server (PID ${pid}).`);
} catch (error) {
  if (error.code === 'ESRCH') {
    fs.unlinkSync(pidFile);
    console.log('The proxy server is no longer running.');
  } else {
    console.error(`Could not stop the proxy server: ${error.message}`);
    process.exit(1);
  }
}
