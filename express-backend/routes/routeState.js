const routes = {
  deepseek: { name: 'DeepSeek', enabled: false, requiresApiKey: true, apiKey: null, apiKeyEnv: 'DEEPSEEK_API_KEY' },
  huggingface: { name: 'Hugging Face', enabled: false, requiresApiKey: true, apiKey: null, apiKeyEnv: 'HF_TOKEN' },
  sarvam: { name: 'Sarvam', enabled: false, requiresApiKey: true, apiKey: null, apiKeyEnv: 'SARVAM_API_KEY' },
  ollama: { name: 'Ollama Cloud', enabled: false, requiresApiKey: true, apiKey: null, apiKeyEnv: 'OLLAMA_API_KEY' },
  ollamaoffline: { name: 'Ollama Local', enabled: false, requiresApiKey: false, apiKey: null, apiKeyEnv: null }
};

for (const [id, route] of Object.entries(routes)) {
  if (route.requiresApiKey && route.apiKeyEnv && process.env[route.apiKeyEnv]) {
    route.apiKey = process.env[route.apiKeyEnv];
  }
}

function enable(id, apiKey) {
  const route = routes[id];
  if (!route) return null;
  if (route.requiresApiKey) {
    if (!apiKey && !route.apiKey) throw new Error(`API key is required for ${route.name}`);
    if (apiKey) route.apiKey = apiKey;
  }
  route.enabled = true;
  return route;
}

function disable(id) {
  const route = routes[id];
  if (!route) return null;
  route.enabled = false;
  return route;
}

function getStatus(id) {
  const route = routes[id];
  if (!route) return null;
  return {
    id,
    name: route.name,
    enabled: route.enabled,
    requiresApiKey: route.requiresApiKey,
    apiKeyConfigured: !route.requiresApiKey || Boolean(route.apiKey)
  };
}

function getAllStatus() {
  return Object.fromEntries(Object.keys(routes).map(id => [id, getStatus(id)]));
}

function requireEnabled(id) {
  return (req, res, next) => {
    if (!routes[id].enabled) {
      return res.status(503).json({ error: `${routes[id].name} route is OFF`, route: id });
    }
    next();
  };
}

module.exports = { routes, enable, disable, getStatus, getAllStatus, requireEnabled };
