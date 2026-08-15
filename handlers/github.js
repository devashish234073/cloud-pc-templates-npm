const fs = require('fs');
const path = require('path');

// Resolve the installed package root via Node's module resolution —
// works regardless of cwd, hoisting depth, or workspace/monorepo layout.
const PACKAGE_ROOT = path.dirname(require.resolve('cloud-pc-templates-marketplace/package.json'));

// Relative path inside the installed package for each key
const REPO_PATHS = {
  'proxy:ollamacloud':   'JS-PROXIES/ollama-proxy.js',
  'proxy:ollamalocal':   'JS-PROXIES/ollamaoffline-proxy.js',
  'proxy:huggingface':   'JS-PROXIES/hf-proxy.js',
  'proxy:deepseek':      'JS-PROXIES/deepseek-proxy.js',
  'proxy:sarvam':        'JS-PROXIES/sarvam-proxy.js',
  'agents:registry':     'JS-AGENTS/agent-registry.json',
  'script:linux':        'cloud-pc-templates/setup_and_run.sh',
  'script:android':      'cloud-pc-templates/setup_and_run_in_termux.sh',
  'script:vectordb':     'misc/vectorDb/vectorDbServer.js',
};

// Kept async so existing `await fetchFromGithub(key)` call sites don't change.
// Returns the real path inside node_modules/cloud-pc-templates-marketplace —
// callers may chmod/spawn it directly; this module no longer downloads,
// caches, or clones anything.
async function fetchFromGithub(key) {
  const relPath = REPO_PATHS[key];
  if (!relPath) throw new Error(`Unknown resource key: "${key}"`);

  const filePath = path.join(PACKAGE_ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found in installed package "cloud-pc-templates-marketplace": ${filePath}`);
  }
  return filePath;
}

module.exports = { fetchFromGithub, REPO_PATHS, PACKAGE_ROOT };