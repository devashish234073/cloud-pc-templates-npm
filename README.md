# Cloud PC Templates

Cloud PC Templates is a command-line tool for managing cloud PC configurations and AI operations.

## Installation

```bash
npm install -g cloud-pc-templates
```
## Video Tutorial

For a step-by-step guide on using Cloud PC Templates, watch this video tutorial:

[![Cloud PC Templates Tutorial](https://img.youtube.com/vi/XMF0K9R2rD0/0.jpg)](https://www.youtube.com/watch?v=XMF0K9R2rD0)

[Click here to watch on YouTube](https://www.youtube.com/watch?v=XMF0K9R2rD0)


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
1. Runs a wrapper service at `http://localhost:3004/health` which is an interface to ollama cloud models, it requires ollama api key.

**Example:**
```bash
$ npx cloud-pc-templates ai login loginMode ollamacloud
Enter API Key: **************************
✓ Logged in
  - Endpoint checked: http://localhost:3004/health
```

##### Ollama Local Login

Connect to Ollama Local models:
```bash
npx cloud-pc-templates ai login loginMode ollamalocal
```

**What it does:**
1. Runs a wrapper service to connect to ollama local models

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

**Features:**
- No API key required
- Checks for local Ollama installation
- Helpful warnings with installation instructions
- Runs proxy on port 3005

##### Hugging Face Login

Connect to Hugging Face services:
```bash
npx cloud-pc-templates ai login loginMode huggingface
```

**What it does:**
1. Runs a wrapper service over huggingface cloud models and it requires huggingface api key

**Example:**
```bash
$ npx cloud-pc-templates ai login loginMode huggingface
Enter Hugging Face API Key: ****************************
✓ Logged in
  - Endpoint checked: http://localhost:3006/health
```

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
### Cross-Platform Support for the launch command
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

## License

ISC

## Author

Devashish Priyadarshi
