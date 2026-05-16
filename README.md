# Cloud PC Templates

Cloud PC Templates is a command-line tool for managing cloud PC configurations and AI operations.

## Installation

```bash
npm install -g cloud-pc-templates
```

## Usage

### Basic Commands

Display help information:
```bash
npx cloud-pc-templates
npx cloud-pc-templates help
npx cloud-pc-templates --help
```

### Launch Website

Open the Cloud PC Templates website in your default browser:
```bash
npx cloud-pc-templates launch
```

This command will open `https://cloud-pc-templates.com` in your browser.

### AI Operations

#### AI Login

The AI module provides login functionality for different cloud providers.

##### Ollama Cloud Login

Connect to Ollama Cloud:
```bash
npx cloud-pc-templates ai login loginMode ollamacloud
```

**What it does:**
1. Checks if you're already logged in by testing the health endpoint at `http://localhost:3004/health`
2. If already logged in, displays "Already logged in" message
3. If not logged in:
   - Prompts you to enter your API Key (masked input with asterisks)
   - Downloads the Ollama proxy script from GitHub
   - Runs the proxy with your API key as an argument
   - Validates the health endpoint
   - Displays "Logged in" confirmation

**Example:**
```bash
$ npx cloud-pc-templates ai login loginMode ollamacloud
Enter API Key: **************************
✓ Logged in
  - Endpoint checked: http://localhost:3004/health
```

**Features:**
- Masked input for API key (shows `*` instead of actual characters)
- Supports pasting long API keys
- Backspace support for corrections
- Cross-platform terminal support (TTY and non-TTY)
- Real-time proxy output logging for debugging

##### Ollama Local Login

Connect to Ollama Local instance:
```bash
npx cloud-pc-templates ai login loginMode ollamalocal
```

**What it does:**
1. Checks if Ollama is running on the default port (11434)
2. If Ollama is not running, displays a warning with installation instructions
3. Downloads the Ollama Offline Proxy script from GitHub
4. Runs the proxy on port 3005 (no API key required)
5. Validates the proxy health endpoint
6. Displays "Logged in" confirmation

**Example (with Ollama running):**
```bash
$ npx cloud-pc-templates ai login loginMode ollamalocal
🔍 Checking if Ollama is running...
✓ Ollama is running on localhost:11434

🚀 Starting Ollama Offline Proxy...
✓ Logged in
  - Endpoint checked: http://localhost:3005/health
  - Ollama running on: localhost:11434
```

**Example (without Ollama running):**
```bash
$ npx cloud-pc-templates ai login loginMode ollamalocal
🔍 Checking if Ollama is running...
⚠️  WARNING: Ollama is not running on localhost:11434
   Please install Ollama and run it before using this login mode.
   Download Ollama from: https://ollama.ai

   After installation, start Ollama with:
   ollama serve

   Continuing anyway...
```

**Features:**
- No API key required
- Checks for local Ollama installation
- Helpful warnings with installation instructions
- Runs proxy on port 3005
- Provides detailed status output

##### Hugging Face Login

Connect to Hugging Face services:
```bash
npx cloud-pc-templates ai login loginMode huggingface
```

**What it does:**
1. Prompts you to enter your Hugging Face API Key (masked input with asterisks)
2. Downloads the Hugging Face proxy script from GitHub
3. Runs the proxy on port 3006 with your API key
4. Validates the proxy health endpoint
5. Displays "Logged in" confirmation

**Example:**
```bash
$ npx cloud-pc-templates ai login loginMode huggingface
Enter Hugging Face API Key: ****************************
✓ Logged in
  - Endpoint checked: http://localhost:3006/health
```

**Features:**
- Masked input for API key (shows `*` instead of actual characters)
- Supports pasting long API keys
- Backspace support for corrections
- Runs proxy on port 3006
- Real-time proxy output logging for debugging
- Get your API key from: https://huggingface.co/settings/tokens

### Command Discovery

The CLI features intelligent command discovery. If you don't provide all required arguments, it shows available options:

```bash
$ npx cloud-pc-templates ai
Available options for: npx cloud-pc-templates ai

  login                - Login to AI service

$ npx cloud-pc-templates ai login
Available options for: npx cloud-pc-templates ai login

  loginMode           - Specify login mode

$ npx cloud-pc-templates ai login loginMode
Available options for: npx cloud-pc-templates ai login loginMode

  ollamacloud         - Connect to Ollama Cloud
  ollamalocal         - Connect to Ollama Local
```

## Architecture

The project follows a modular handler-based architecture:

```
cloud-pc-templates/
├── index.js                 # Main entry point, command tree, and CLI routing
├── handlers/
│   ├── ollamacloud.js      # Ollama Cloud login functionality
│   ├── ollamalocal.js      # Ollama Local login functionality
│   ├── huggingface.js      # Hugging Face login functionality
│   └── launch.js           # Website launcher
├── package.json            # Project metadata and bin configuration
└── README.md               # This file
```

### Modules

#### index.js
- **Command Tree**: Hierarchical command structure supporting nested subcommands
- **Argument Parsing**: Handles command-line arguments with `--` prefix stripping
- **Request Routing**: Routes commands to appropriate handlers

#### handlers/ollamacloud.js
- `promptForApiKey()`: Interactive masked API key input
- `checkHealthEndpoint()`: Health check for proxy server
- `downloadAndRunProxy()`: Downloads and executes proxy script with API key
- `checkAndLoginOllamaCloud()`: Main login orchestrator

#### handlers/ollamalocal.js
- `checkOllamaHealth()`: Verifies Ollama is running on port 11434
- `downloadAndRunProxy()`: Downloads and executes offline proxy script
- `checkProxyHealth()`: Health check for the offline proxy
- `checkAndLoginOllamaLocal()`: Main login orchestrator with warning system

#### handlers/huggingface.js
- `promptForApiKey()`: Interactive masked API key input
- `checkHealthEndpoint()`: Health check for proxy server
- `downloadAndRunProxy()`: Downloads and executes proxy script with API key
- `checkAndLoginHuggingFace()`: Main login orchestrator

#### handlers/launch.js
- `openBrowser()`: Cross-platform browser launcher
- `launchWebsite()`: Opens cloud-pc-templates.com

## Features

### Masked API Key Input
When logging in to Ollama Cloud, your API key is protected:
- Each character you type displays as an asterisk `*`
- Works with keyboard input and pasted text
- Supports backspace for corrections

### Cross-Platform Support
The launch command works on:
- macOS (uses `open` command)
- Linux (uses `xdg-open` command)
- Windows (uses `start` command)
- Android/Termux (uses `termux-open` with fallback to `xdg-open`)

### Health Check System
The Ollama Cloud login includes automatic health checking:
- Validates server is ready before completing login
- Provides endpoint information for debugging
- Includes detailed output from proxy process

### Intelligent Command Discovery
The CLI provides helpful feedback when commands are incomplete:
- Shows available options at each level
- Supports `--help` flag at any point
- Clear, formatted output with descriptions

## Development

### File Structure
```
handlers/
├── ollamacloud.js         # Ollama Cloud specific logic
└── launch.js              # Launch specific logic
```

Each handler is a separate module that can be:
- Independently tested
- Updated without affecting other modules
- Extended with new features
- Reused in other projects

### Adding New Commands

To add a new command:

1. Create a new handler file in `handlers/`:
```javascript
// handlers/mycommand.js
async function myCommandHandler() {
  // Implementation
}

module.exports = { myCommandHandler };
```

2. Import it in `index.js`:
```javascript
const { myCommandHandler } = require('./handlers/mycommand');
```

3. Add it to the command tree:
```javascript
const commandTree = {
  // ... existing commands
  mycommand: {
    description: 'My command description',
    handler: () => myCommandHandler()
  }
};
```

## NPM Script

The project is configured with a binary entrypoint in `package.json`:

```json
{
  "bin": {
    "cloud-pc-templates": "index.js"
  }
}
```

This enables the `npx cloud-pc-templates` command globally.

## API Key Security

When entering your API key:
- Input is masked with asterisks
- Key is passed directly to the proxy process
- Never logged or stored in plain text
- Passed via command-line argument or environment variable

## Troubleshooting

### "Unknown command" error
- Make sure you've spelled the command correctly
- Use `npx cloud-pc-templates help` to see available commands
- Commands are case-sensitive

### Ollama Cloud login fails
- Check that you have a valid API key
- Ensure your network connection is stable
- Try checking if the health endpoint is accessible manually:
  ```bash
  curl http://localhost:3004/health
  ```

### Ollama Local login fails
- Make sure Ollama is installed: https://ollama.ai
- Start Ollama with: `ollama serve`
- Check if Ollama is running on port 11434:
  ```bash
  curl http://localhost:11434/api/tags
  ```
- Ensure port 3005 is not in use by another application

### Hugging Face login fails
- Check that you have a valid Hugging Face API key
- Get your API key from: https://huggingface.co/settings/tokens
- Make sure your API key has the necessary permissions
- Ensure port 3006 is not in use by another application
- Check your internet connection for accessing Hugging Face services

### Browser won't open with `launch`
- Ensure you have a default browser configured
- On Linux, make sure `xdg-open` is installed: `sudo apt-get install xdg-utils`
- On Windows, ensure a browser is set as default
- On Android/Termux:
  - For best results, install Termux API: `pkg install termux-api`
  - Otherwise, `xdg-open` will be used as fallback
  - Ensure you have a browser app installed on your device

## Video Tutorial

For a step-by-step guide on using Cloud PC Templates, watch this video tutorial:

[![Cloud PC Templates Tutorial](https://img.youtube.com/vi/XMF0K9R2rD0/0.jpg)](https://www.youtube.com/watch?v=XMF0K9R2rD0)

[Click here to watch on YouTube](https://www.youtube.com/watch?v=XMF0K9R2rD0)

## License

ISC

## Author

Cloud PC Templates Contributors
