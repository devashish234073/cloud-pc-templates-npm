# Cloud PC Templates

Cloud PC Templates is a command-line tool for managing cloud PC configurations and AI operations.

## For sdk please visit: https://www.npmjs.com/package/cloud-pc-templates-sdk

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

##### Login Health

Check which login mode proxy ports are currently available:
```bash
npx cloud-pc-templates ai login health
```

**What it does:**
1. Checks the health endpoints for all supported login modes without starting any proxy or prompting for API keys.
2. Shows whether each login mode is available on localhost.

**Ports checked:**
- Hugging Face: `http://localhost:3003/health`
- Ollama Cloud: `http://localhost:3004/health`
- Ollama Local: `http://localhost:3005/health`

**Example:**
```bash
$ npx cloud-pc-templates ai login health
AI login health

+-------------+---------------+--------------------+------------------------------+
| Mode        | Status        | Description        | Health Endpoint              |
+-------------+---------------+--------------------+------------------------------+
| huggingface | ✓ available   | Hugging Face proxy | http://localhost:3003/health |
| ollamacloud | ✗ unavailable | Ollama Cloud proxy | http://localhost:3004/health |
| ollamalocal | ✗ unavailable | Ollama Local proxy | http://localhost:3005/health |
+-------------+---------------+--------------------+------------------------------+
```

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
  - Endpoint checked: http://localhost:3003/health
```

#### AI Chat

List available chat login modes:
```bash
npx cloud-pc-templates ai chat
```

List models for one login mode:
```bash
npx cloud-pc-templates ai chat ollamalocal
```

Validate a model name and start interactive chat:
```bash
npx cloud-pc-templates ai chat ollamalocal qwen3:0.6b
```

**What it does:**
1. `ai chat` shows the currently supported login modes.
2. `ai chat <loginmode>` calls that login mode's `/v1/models` endpoint and lists model IDs from the response `data` array.
3. `ai chat <loginmode> <model-name>` checks that login mode's `/v1/models` endpoint and starts an interactive chat when the model exists.
4. Each question is sent to `/v1/chat/completions` with the full in-memory conversation history.
5. Enter `quit`, `exit`, `bye`, or `done` to leave interactive chat.

**Example model listing:**
```bash
$ npx cloud-pc-templates ai chat ollamalocal
Available models for ollamalocal:
Endpoint: http://localhost:3005/v1/models

  - qwen3:0.6b

Run: npx cloud-pc-templates ai chat ollamalocal <model-name>
```

**Example interactive chat:**
```bash
$ npx cloud-pc-templates ai chat ollamalocal qwen3:0.6b
✓ Model "qwen3:0.6b" is available for ollamalocal.

Interactive chat started for ollamalocal/qwen3:0.6b.
Type quit, exit, bye, or done to end.

You: HI
Assistant: Hi there! How can I assist you today? 😊
You: done
Chat ended.
```

#### AI Agents

Manage and explore available AI agents from the registry.

**Agent Registry URL:**
```
https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main/JS-AGENTS/agent-registry.json
```

##### List All Agents

Display all available agents with their IDs, names, and ports:
```bash
npx cloud-pc-templates ai agents list
```

**Example output:**
```bash
$ npx cloud-pc-templates ai agents list

Available Agents

────────────────────────────────────────────────────────────────────────────────
ID: playwright connector
Name: Playwright Connector
Port: 3036
────────────────────────────────────────────────────────────────────────────────
ID: mysql connector
Name: MySQL Connector
Port: 3037
────────────────────────────────────────────────────────────────────────────────
ID: angular connector
Name: Angular Connector
Port: 3034
────────────────────────────────────────────────────────────────────────────────
```

##### Get Agent Details

Display complete information for a specific agent:
```bash
npx cloud-pc-templates ai agents "agent-id"
```

##### Start All Agents

Download, set up, and start all agents on a supported platform:

```bash
npx cloud-pc-templates ai agents startAllOn <platform>
```

**Supported platforms:**

| Platform  | Command | Description |
|-----------|---------|-------------|
| `linux`   | `npx cloud-pc-templates ai agents startAllOn linux` | Downloads and runs `setup_and_run.sh`. Requires `bash` and an Ubuntu/Debian-based system. |
| `android` | `npx cloud-pc-templates ai agents startAllOn android` | Downloads and runs `setup_and_run_in_termux.sh` for Termux on Android. Requires `bash`. |
| `docker`  | `npx cloud-pc-templates ai agents startAllOn docker` | Runs the pre-built Docker image `devashish234073/cloud-pc-templates-agents` with ports 3005–3100 and 4200 mapped. Requires `docker`. |

**Linux example:**
```bash
$ npx cloud-pc-templates ai agents startAllOn linux
✓ bash found. Downloading and running setup_and_run.sh...

==========================================
Cloud PC Templates Agents Setup
==========================================
...
```

**Docker example:**
```bash
$ npx cloud-pc-templates ai agents startAllOn docker
✓ docker found. Starting agents container...
```

> **Note:** If you are on an unsupported platform (e.g. Windows), use the `docker` option to run the agents via a container.

### Command Discovery

The CLI features intelligent command discovery. If you don't provide all required arguments, it shows available options:

```bash
$ npx cloud-pc-templates ai
Available options for: npx cloud-pc-templates ai

  login                - Login to AI service
  chat                 - List or validate AI chat models
  agents               - Manage AI agents

$ npx cloud-pc-templates ai login
Available options for: npx cloud-pc-templates ai login

  health              - Check available login mode ports
  loginMode           - Specify login mode

$ npx cloud-pc-templates ai login loginMode
Available options for: npx cloud-pc-templates ai login loginMode

  huggingface         - Connect to Hugging Face
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
│   ├── chat.js             # AI chat model listing and validation
│   ├── loginModes.js       # Shared login mode configuration
│   ├── loginHealth.js      # Login mode health checks
│   ├── agents.js           # AI agents registry management
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
The login commands include automatic health checking:
- `ai login health` checks Hugging Face, Ollama Cloud, and Ollama Local proxy ports
- Login commands validate the proxy server before completing login
- Endpoint information is printed for debugging
- Proxy process output is shown when a login command starts a service

### Chat Model Discovery
The chat command discovers models through the active login mode proxies:
- `ai chat` lists supported login modes from the shared login mode configuration
- `ai chat <loginmode>` reads `http://localhost:<port>/v1/models`
- `ai chat <loginmode> <model-name>` validates the model and sends questions to `http://localhost:<port>/v1/chat/completions`

### Intelligent Command Discovery
The CLI provides helpful feedback when commands are incomplete:
- Shows available options at each level
- Supports `--help` flag at any point
- Clear, formatted output with descriptions

## Development

### File Structure
```
handlers/
├── chat.js                # AI chat model listing and validation
├── loginModes.js          # Shared login mode configuration
├── ollamacloud.js         # Ollama Cloud specific logic
├── loginHealth.js         # Login health check logic
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
