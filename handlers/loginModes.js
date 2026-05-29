const LOGIN_MODES = [
  {
    mode: 'huggingface',
    port: 3003,
    healthPath: '/health',
    modelsPath: '/v1/models',
    description: 'Hugging Face proxy',
    loginDescription: 'Connect to Hugging Face'
  },
  {
    mode: 'ollamacloud',
    port: 3004,
    healthPath: '/health',
    modelsPath: '/v1/models',
    description: 'Ollama Cloud proxy',
    loginDescription: 'Connect to Ollama Cloud'
  },
  {
    mode: 'ollamalocal',
    port: 3005,
    healthPath: '/health',
    modelsPath: '/v1/models',
    description: 'Ollama Local proxy',
    loginDescription: 'Connect to Ollama Local'
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
