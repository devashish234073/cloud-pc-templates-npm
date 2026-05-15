#!/usr/bin/env node

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
              }
            }
          }
        }
      }
    }
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
  console.log('');
  console.log('AI Commands:');
  console.log('  npx cloud-pc-templates ai login loginMode ollamacloud');
  console.log('  npx cloud-pc-templates ai login loginMode ollamalocal');
}

// Default AI function
function aiDefault() {
  console.log('AI function - Use "npx cloud-pc-templates ai --help" for options');
}

// AI Login function
function aiLogin(mode) {
  console.log(`✓ AI Login initialized with mode: ${mode}`);
  if (mode === 'ollamacloud') {
    console.log('  - Connecting to Ollama Cloud...');
    console.log('  - Initializing cloud connection...');
  } else if (mode === 'ollamalocal') {
    console.log('  - Connecting to Ollama Local...');
    console.log('  - Initializing local connection...');
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
function traverseCommandTree(args) {
  let currentNode = commandTree;
  let path = [];
  
  for (let i = 0; i < args.length; i++) {
    let arg = args[i].replace(/^--/, ''); // Remove -- prefix
    
    // Check if current node has subcommands
    if (currentNode.subcommands && currentNode.subcommands[arg]) {
      currentNode = currentNode.subcommands[arg];
      path.push(arg);
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
  // Check if we have subcommands available but user didn't provide all args
  if (currentNode.subcommands) {
    showAvailableOptions(currentNode, path);
  } else if (currentNode.handler) {
    // Execute the handler if available
    currentNode.handler();
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
    traverseCommandTree(args);
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