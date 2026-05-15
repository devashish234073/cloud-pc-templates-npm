const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// Function to get masked API key input
function promptForApiKey() {
  return new Promise((resolve) => {
    process.stdout.write('Enter API Key: ');
    
    const stdin = process.stdin;
    
    // Handle both TTY and non-TTY environments
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    
    let apiKey = '';
    
    stdin.on('data', (buffer) => {
      const chunk = buffer.toString();
      
      // Process each character in the chunk (handles pasted text)
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        
        if (char === '\n' || char === '\r' || char === '\u0004') {
          // Enter or EOF
          if (stdin.isTTY) {
            stdin.setRawMode(false);
          }
          stdin.pause();
          stdin.removeAllListeners('data');
          console.log('');
          resolve(apiKey);
          return;
        } else if (char === '\u0003') {
          // Ctrl+C
          if (stdin.isTTY) {
            stdin.setRawMode(false);
          }
          process.exit();
        } else if (char === '\x7f' || char === '\b') {
          // Backspace
          if (apiKey.length > 0) {
            apiKey = apiKey.slice(0, -1);
            process.stdout.write('\x1b[D\x1b[K');
          }
        } else if (char >= '\x20' && char <= '\x7e') {
          // Printable character
          apiKey += char;
          process.stdout.write('*');
        }
      }
    });
  });
}

// Function to check health endpoint
function checkHealthEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const request = protocol.request(url, { method: 'GET' }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    request.on('error', () => {
      resolve(false);
    });
    
    request.end();
  });
}

// Function to download and run the proxy
async function downloadAndRunProxy(endpoint) {
  const url = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-PROXIES/ollama-proxy.js';
  const tempFile = path.join(os.tmpdir(), 'ollama-proxy.js');
  
  // Download the file
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tempFile);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
  
  // Get API key from user
  const apiKey = await promptForApiKey();
  
  // Run the proxy with API key passed as command-line argument
  return new Promise((resolve, reject) => {
    const child = spawn('node', [tempFile, apiKey]);
    
    let serverReady = false;
    
    // Capture stdout to detect when server is ready
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Check if server indicates it's ready
      if (output.includes('listening') || output.includes('started') || output.includes('running')) {
        serverReady = true;
      }
    });
    
    // Capture stderr for error messages
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    // Wait a bit for server to start, then validate
    setTimeout(async () => {
      try {
        const isHealthy = await checkHealthEndpoint(endpoint);
        if (isHealthy) {
          console.log('✓ Logged in');
          console.log(`  - Endpoint checked: ${endpoint}`);
          resolve();
        } else {
          console.log('✓ Proxy started');
          console.log(`  - Endpoint: ${endpoint}`);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    }, 2000);
    
    child.on('error', reject);
  });
}

// Function to check and login to Ollama Cloud
async function checkAndLoginOllamaCloud() {
  const endpoint = 'http://localhost:3004/health';
  
  try {
    const isHealthy = await checkHealthEndpoint(endpoint);
    if (isHealthy) {
      console.log('✓ Already logged in');
      console.log(`  - Endpoint checked: ${endpoint}`);
      return;
    }
    
    // Not healthy, download and run proxy
    await downloadAndRunProxy(endpoint);
  } catch (error) {
    console.error('Error during login:', error.message);
  }
}

module.exports = {
  checkAndLoginOllamaCloud,
  checkHealthEndpoint,
  downloadAndRunProxy,
  promptForApiKey
};
