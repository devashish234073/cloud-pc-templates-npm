#!/usr/bin/env node

const { checkAndLoginOllamaCloud } = require('./handlers/ollamacloud');
const { checkAndLoginOllamaLocal } = require('./handlers/ollamalocal');
const { checkAndLoginHuggingFace } = require('./handlers/huggingface');
const { launchWebsite } = require('./handlers/launch');
const { listAgents, getAgentDetails } = require('./handlers/agents');

// Command tree structure
const commandTree = {
  help: {
    description: 'Show help information',
    handler: help
  },
  ai: {
    description: 'Run AI operations',
    handler: aiDefault,
    subcommands: {
      login: {
        description: 'Login to AI service',
        subcommands: {
          loginMode: {
            description: 'Specify login mode',
            subcommands: {
              ollamacloud: {
                description: 'Connect to Ollama Cloud',
                handler: () => aiLogin('ollamacloud')
              },
              ollamalocal: {
                description: 'Connect to Ollama Local',
                handler: () => aiLogin('ollamalocal')
              },
              huggingface: {
                description: 'Connect to Hugging Face',
                handler: () => aiLogin('huggingface')
              }
            }
          }
        }
      },
      agents: {
        description: 'Manage AI agents',
        handler: aiAgents,
        dynamic: true
      }
    }
  },
  launch: {
    description: 'Launch cloud-pc-templates.com in browser',
    handler: () => launchWebsite()
  }
};

// Help function
function help() {
  console.log('Cloud PC Templates - Help');
  console.log('');
  console.log('Usage:');
  console.log('  npx cloud-pc-templates          Show this help message');
  console.log('  npx cloud-pc-templates help     Show this help message');
  console.log('  npx cloud-pc-templates --help   Show this help message');
  console.log('  npx cloud-pc-templates ai       Run AI function');
  console.log('  npx cloud-pc-templates launch   Open website in browser');
  console.log('');
  console.log('AI Commands:');
  console.log('  npx cloud-pc-templates ai login loginMode ollamacloud');
  console.log('  npx cloud-pc-templates ai login loginMode ollamalocal');
  console.log('  npx cloud-pc-templates ai login loginMode huggingface');
  console.log('  npx cloud-pc-templates ai agents list                           List all available agents');
  console.log('  npx cloud-pc-templates ai agents "agent-name"                   Show agent details');
}

// Default AI function
function aiDefault() {
  console.log('AI function - Use "npx cloud-pc-templates ai --help" for options');
}

// AI Login function
async function aiLogin(mode) {
  if (mode === 'ollamacloud') {
    await checkAndLoginOllamaCloud();
  } else if (mode === 'ollamalocal') {
    await checkAndLoginOllamaLocal();
  } else if (mode === 'huggingface') {
    await checkAndLoginHuggingFace();
  }
}

// AI Agents function
async function aiAgents(remainingArgs) {
  if (!remainingArgs || remainingArgs.length === 0) {
    console.log('Usage: npx cloud-pc-templates ai agents <list|agent-name>');
    console.log('  list               List all available agents');
    console.log('  "agent-name"       Show details for a specific agent');
    return;
  }
  
  const subcommand = remainingArgs[0].toLowerCase();
  
  if (subcommand === 'list') {
    await listAgents();
  } else {
    await getAgentDetails(remainingArgs[0]);
  }
}

// Function to show available options at a certain level
function showAvailableOptions(node, path) {
  if (!node || !node.subcommands) {
    return;
  }
  
  const pathStr = path.length > 0 ? path.join(' ') + ' ' : '';
  console.log(`Available options for: npx cloud-pc-templates ${pathStr}`);
  console.log('');
  
  Object.entries(node.subcommands).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(20)} - ${value.description || ''}`);
  });
}

// Function to traverse command tree and execute or show options
function traverseCommandTree(args, startNode, startPath = []) {
  let currentNode = startNode;
  let path = startPath;
  let argIndex = 1; // Start from the second argument (first is already matched in processArgs)
  
  // Normal command tree traversal
  while (argIndex < args.length) {
    let arg = args[argIndex].replace(/^--/, ''); // Remove -- prefix
    
    // Check if current node is dynamic, if so pass remaining args to handler
    if (currentNode.dynamic && currentNode.handler) {
      const remainingArgs = args.slice(argIndex);
      const result = currentNode.handler(remainingArgs);
      if (result instanceof Promise) {
        result.catch(err => console.error('Error:', err.message));
      }
      return;
    }
    
    // Check if current node has subcommands
    if (currentNode.subcommands && currentNode.subcommands[arg]) {
      currentNode = currentNode.subcommands[arg];
      path.push(arg);
      argIndex++;
    } else if (arg === 'help' || arg === '--help') {
      showAvailableOptions(currentNode, path);
      return;
    } else {
      console.log(`Unknown option: ${arg}`);
      showAvailableOptions(currentNode, path);
      return;
    }
  }
  
  // At this point, we've traversed all provided arguments
  // Check if current node is dynamic and we've consumed all args
  if (currentNode.dynamic && currentNode.handler) {
    const remainingArgs = [];
    const result = currentNode.handler(remainingArgs);
    if (result instanceof Promise) {
      result.catch(err => console.error('Error:', err.message));
    }
    return;
  }
  
  // Check if we have subcommands available but user didn't provide all args
  if (currentNode.subcommands) {
    showAvailableOptions(currentNode, path);
  } else if (currentNode.handler) {
    // Execute the handler if available (could be async)
    const result = currentNode.handler();
    if (result instanceof Promise) {
      result.catch(err => console.error('Error:', err.message));
    }
  } else {
    console.log('Command complete but no action defined');
  }
}

// Main function to handle arguments
function processArgs() {
  const args = process.argv.slice(2); // Remove node and script path
  
  if (args.length === 0) {
    help();
    return;
  }
  
  // Get the first argument and remove any -- prefix
  let command = args[0].replace(/^--/, '');
  
  if (commandTree[command]) {
    traverseCommandTree(args, commandTree[command], [command]);
  } else {
    console.log(`Unknown command: ${command}`);
    help();
  }
}

// Run if executed directly
if (require.main === module) {
  processArgs();
}

// Export functions for use as a module
module.exports = {
  help,
  aiDefault,
  aiLogin,
  processArgs,
  commandTree
};