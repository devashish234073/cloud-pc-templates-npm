const LOGIN_MODES = [
  {
    mode: 'huggingface',
    port: 3003,
    healthPath: '/health',
    modelsPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    description: 'Hugging Face proxy',
    loginDescription: 'Connect to Hugging Face'
  },
  {
    mode: 'ollamacloud',
    port: 3004,
    healthPath: '/health',
    modelsPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    description: 'Ollama Cloud proxy',
    loginDescription: 'Connect to Ollama Cloud'
  },
  {
    mode: 'ollamalocal',
    port: 3005,
    healthPath: '/health',
    modelsPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    description: 'Ollama Local proxy',
    loginDescription: 'Connect to Ollama Local'
  },
  {
    mode: 'deepseek',
    port: 3006,
    healthPath: '/health',
    modelsPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    description: 'DeepSeek proxy',
    loginDescription: 'Connect to DeepSeek'
  },
  {
    mode: 'sarvam',
    port: 3007,
    healthPath: '/health',
    modelsPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    description: 'Sarvam proxy',
    loginDescription: 'Connect to Sarvam'
  }
];

function getLoginModes() {
  return LOGIN_MODES.slice();
}

function getLoginMode(mode) {
  return LOGIN_MODES.find((loginMode) => loginMode.mode === mode);
}

function getEndpoint(loginMode, pathKey) {
  return `http://localhost:${loginMode.port}${loginMode[pathKey]}`;
}

module.exports = {
  getEndpoint,
  getLoginMode,
  getLoginModes
};
