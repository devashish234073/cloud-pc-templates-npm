const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const OLLAMA_PORT = 11434;
const PROXY_PORT = 3005;

// Function to check if Ollama is running locally
function checkOllamaHealth() {
  return new Promise((resolve) => {
    const request = http.request(
      {
        hostname: 'localhost',
        port: OLLAMA_PORT,
        path: '/api/tags',
        method: 'GET'
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );
    
    request.on('error', () => {
      resolve(false);
    });
    
    request.end();
  });
}

// Function to download and run the offline proxy
async function downloadAndRunProxy() {
  const url = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-PROXIES/ollamaoffline-proxy.js';
  const tempFile = path.join(os.tmpdir(), 'ollamaoffline-proxy.js');
  
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
  
  // Run the proxy (no API key needed)
  return new Promise((resolve, reject) => {
    const child = spawn('node', [tempFile]);
    
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
        const endpoint = `http://localhost:${PROXY_PORT}/health`;
        const isHealthy = await checkProxyHealth(endpoint);
        if (isHealthy) {
          console.log('✓ Logged in');
          console.log(`  - Endpoint checked: ${endpoint}`);
          console.log(`  - Ollama running on: localhost:${OLLAMA_PORT}`);
        } else {
          console.log('✓ Proxy started');
          console.log(`  - Endpoint: ${endpoint}`);
          console.log(`  - Ollama running on: localhost:${OLLAMA_PORT}`);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 2000);
    
    child.on('error', reject);
  });
}

// Function to check health endpoint
function checkProxyHealth(endpoint) {
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

// Function to check and login to Ollama Local
async function checkAndLoginOllamaLocal() {
  try {
    console.log('🔍 Checking if Ollama is running...');
    const isOllamaRunning = await checkOllamaHealth();
    
    if (!isOllamaRunning) {
      console.warn('⚠️  WARNING: Ollama is not running on localhost:11434');
      console.warn('   Please install Ollama and run it before using this login mode.');
      console.warn('   Download Ollama from: https://ollama.ai');
      console.warn('');
      console.warn('   After installation, start Ollama with:');
      console.warn('   ollama serve');
      console.warn('');
      console.warn('   Continuing anyway...');
    } else {
      console.log('✓ Ollama is running on localhost:11434');
    }
    
    console.log('');
    console.log('🚀 Starting Ollama Offline Proxy...');
    await downloadAndRunProxy();
  } catch (error) {
    console.error('Error during login:', error.message);
  }
}

module.exports = {
  checkAndLoginOllamaLocal,
  checkOllamaHealth,
  downloadAndRunProxy,
  checkProxyHealth
};
