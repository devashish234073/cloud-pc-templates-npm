const { exec } = require('child_process');
const os = require('os');

// Function to open URL in default browser
function openBrowser(url) {
  return new Promise((resolve, reject) => {
    let command;
    
    switch (os.platform()) {
      case 'darwin':
        // macOS
        command = `open "${url}"`;
        break;
      case 'linux':
        // Linux
        command = `xdg-open "${url}"`;
        break;
      case 'android':
        // Termux/Android - try termux-open first, fallback to xdg-open
        command = `termux-open "${url}" || xdg-open "${url}"`;
        break;
      case 'win32':
        // Windows
        command = `start "${url}"`;
        break;
      default:
        reject(new Error(`Unsupported platform: ${os.platform()}`));
        return;
    }
    
    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Function to launch cloud-pc-templates website
async function launchWebsite() {
  try {
    console.log('🚀 Launching cloud-pc-templates.com...');
    await openBrowser('https://cloud-pc-templates.com');
    console.log('✓ Browser opened successfully');
  } catch (error) {
    console.error('Error launching browser:', error.message);
  }
}

module.exports = {
  launchWebsite,
  openBrowser
};
