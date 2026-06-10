const { spawn, execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const AGENTS_REGISTRY_URL = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-AGENTS/agent-registry.json';
const SETUP_SCRIPT_URL = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/main/cloud-pc-templates/setup_and_run.sh';
const TERMUX_SETUP_SCRIPT_URL = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/cloud-pc-templates/setup_and_run_in_termux.sh';

async function fetchAgentsRegistry() {
  try {
    const response = await fetch(AGENTS_REGISTRY_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents registry: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch agents registry: ${error.message}`);
  }
}

async function listAgents() {
  try {
    const agents = await fetchAgentsRegistry();
    
    if (!Array.isArray(agents) || agents.length === 0) {
      console.log('No agents found in registry');
      return;
    }
    
    console.log('\nAvailable Agents\n');
    console.log('─'.repeat(80));
    
    agents.forEach((agent) => {
      const idStr = `ID: ${agent.id}`.padEnd(40);
      const nameStr = `Name: ${agent.name}`.padEnd(40);
      const portStr = `Port: ${agent.port || 'N/A'}`;
      
      console.log(idStr);
      console.log(nameStr);
      console.log(portStr);
      console.log('─'.repeat(80));
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function getAgentDetails(agentId) {
  try {
    const agents = await fetchAgentsRegistry();
    
    if (!Array.isArray(agents)) {
      console.error('Invalid registry format');
      process.exit(1);
    }
    
    const agent = agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
    
    if (!agent) {
      console.error(`❌ Agent not found: "${agentId}"`);
      console.log('\nAvailable agents:');
      agents.forEach(a => console.log(`  - ${a.id}`));
      process.exit(1);
    }
    
    console.log(`\nAgent Details: ${agent.name}\n`);
    console.log('─'.repeat(80));
    
    Object.entries(agent).forEach(([key, value]) => {
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (typeof value === 'string' && value.length > 70) {
        console.log(`${displayKey}:`);
        console.log(`  ${value}`);
      } else {
        console.log(`${displayKey}: ${value}`);
      }
    });
    
    console.log('─'.repeat(80) + '\n');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function startAllOnAgents(platform) {
  if (!platform) {
    console.log('Usage: npx cloud-pc-templates ai agents startAllOn <platform>');
    console.log('  Supported platforms:');
    console.log('    linux      Download and start all agents on Linux (requires bash)');
    console.log('    android    Download and start all agents in Termux on Android (requires bash)');
    console.log('    docker     Start all agents via Docker container');
    return;
  }

  const platformLower = platform.toLowerCase();

  if (platformLower === 'linux' || platformLower === 'android') {
    // Check if bash exists
    const bashCmd = process.platform === 'win32' ? 'where bash' : 'which bash';
    try {
      execSync(bashCmd, { stdio: 'ignore' });
    } catch (err) {
      console.error('❌ bash not found.');
      console.error('   This command is meant for Linux only that has bash.');
      process.exit(1);
    }

    const scriptUrl = platformLower === 'linux' ? SETUP_SCRIPT_URL : TERMUX_SETUP_SCRIPT_URL;
    const scriptName = platformLower === 'linux' ? 'setup_and_run.sh' : 'setup_and_run_in_termux.sh';

    console.log(`✓ bash found. Downloading and running ${scriptName}...\n`);

    // Download script to a temp file
    const tempFile = path.join(os.tmpdir(), `cloud-pc-${scriptName}`);

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFile);
      https.get(scriptUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download setup script: ${res.statusCode} ${res.statusMessage}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', reject);
    });

    // Make the script executable
    fs.chmodSync(tempFile, '755');

    // Execute the script with bash
    const child = spawn('bash', [tempFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('error', (err) => {
      console.error(`❌ Failed to run setup script: ${err.message}`);
      process.exit(1);
    });

    child.on('close', (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // ignore cleanup errors
      }
      if (code !== 0) {
        console.error(`\n❌ Setup script exited with code ${code}`);
        process.exit(code);
      } else {
        console.log('\n✓ All agents started successfully.');
      }
    });

  } else if (platformLower === 'docker') {
    // Check if docker exists
    const dockerCmd = process.platform === 'win32' ? 'where docker' : 'which docker';
    try {
      execSync(dockerCmd, { stdio: 'ignore' });
    } catch (err) {
      console.error('❌ docker not found.');
      console.error('   Please install Docker first: https://docs.docker.com/get-docker/');
      process.exit(1);
    }

    console.log('✓ docker found. Starting agents container...\n');

    const child = spawn('docker', [
      'run',
      '-p', '3005-3050:3005-3050',
      '-p', '4200:4200',
      'devashish234073/cloud-pc-templates-agents'
    ], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('error', (err) => {
      console.error(`❌ Failed to run docker: ${err.message}`);
      process.exit(1);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Docker exited with code ${code}`);
        process.exit(code);
      } else {
        console.log('\n✓ All agents started successfully.');
      }
    });

  } else {
    console.error(`❌ Unknown platform: "${platform}"`);
    console.log('  Supported platforms: linux, android, docker');
    console.log('  Tip: Try "npx cloud-pc-templates ai agents startAllOn docker" to run via Docker on any platform.');
    process.exit(1);
  }
}

module.exports = {
  listAgents,
  getAgentDetails,
  startAllOnAgents
};
