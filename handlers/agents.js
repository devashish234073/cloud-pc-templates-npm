const AGENTS_REGISTRY_URL = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-AGENTS/agent-registry.json';

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

module.exports = {
  listAgents,
  getAgentDetails
};
