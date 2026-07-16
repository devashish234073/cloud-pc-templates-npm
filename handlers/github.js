const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const BASE = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/refs/heads/main';
const MAIN = 'https://raw.githubusercontent.com/devashish234073/cloud-pc-templates-marketplace/main';
const REPO_CLONE_URL = 'https://github.com/devashish234073/cloud-pc-templates-marketplace.git';
const REPO_DIR_NAME = 'cloud-pc-templates-marketplace';

const URLS = {
  'proxy:ollamacloud':   `${BASE}/JS-PROXIES/ollama-proxy.js`,
  'proxy:ollamalocal':   `${BASE}/JS-PROXIES/ollamaoffline-proxy.js`,
  'proxy:huggingface':   `${BASE}/JS-PROXIES/hf-proxy.js`,
  'proxy:deepseek':      `${BASE}/JS-PROXIES/deepseek-proxy.js`,
  'proxy:sarvam':        `${BASE}/JS-PROXIES/sarvam-proxy.js`,
  'agents:registry':     `${BASE}/JS-AGENTS/agent-registry.json`,
  'script:linux':        `${MAIN}/cloud-pc-templates/setup_and_run.sh`,
  'script:android':      `${BASE}/cloud-pc-templates/setup_and_run_in_termux.sh`,
  'script:vectordb':     `${BASE}/misc/vectorDb/vectorDbServer.js`,
};

// Relative path inside the cloned repo for each key
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

const CACHE_DIR = path.join(os.homedir(), '.cloud-pc-templates', 'cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_FILE = path.join(CACHE_DIR, 'git-call-failed');
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 60 * 1000;

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Returns the timestamp stored in git-call-failed, or null if file doesn't exist
function getRateLimitTimestamp() {
  if (!fs.existsSync(RATE_LIMIT_FILE)) return null;
  const content = fs.readFileSync(RATE_LIMIT_FILE, 'utf8').trim();
  const ts = parseInt(content, 10);
  return isNaN(ts) ? null : ts;
}

function isRateLimited() {
  const ts = getRateLimitTimestamp();
  if (ts === null) return false;
  return Date.now() - ts < RATE_LIMIT_COOLDOWN_MS;
}

function markRateLimited() {
  ensureCacheDir();
  fs.writeFileSync(RATE_LIMIT_FILE, String(Date.now()));
}

// Clears the rate-limit flag (called after cooldown expires)
function clearRateLimit() {
  if (fs.existsSync(RATE_LIMIT_FILE)) fs.unlinkSync(RATE_LIMIT_FILE);
}

// Cache filename format: <key-with-dashes>.<timestamp><ext>
function getCachedFile(key, ext) {
  const prefix = key.replace(':', '-');
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(`${prefix}.`) && f.endsWith(ext));
  if (!files.length) return null;

  files.sort().reverse();
  const match = files[0].match(new RegExp(`^${prefix}\\.(\\d+)\\${ext}$`));
  if (!match) return null;

  const timestamp = parseInt(match[1], 10);
  if (Date.now() - timestamp > CACHE_TTL_MS) return null;

  return path.join(CACHE_DIR, files[0]);
}

async function downloadToCache(key, url, ext) {
  const filename = `${key.replace(':', '-')}.${Date.now()}${ext}`;
  const filePath = path.join(CACHE_DIR, filename);

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      if (res.statusCode === 429) {
        file.close();
        try { fs.unlinkSync(filePath); } catch (_) {}
        return reject(Object.assign(new Error(`HTTP 429 rate limited fetching ${url}`), { code: 'RATE_LIMITED' }));
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(filePath); } catch (_) {}
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });

  return filePath;
}

// Ensures the repo is cloned/pulled in cwd, returns the repo dir path
function ensureLocalRepo() {
  const repoDir = path.join(process.cwd(), REPO_DIR_NAME);
  if (fs.existsSync(path.join(repoDir, '.git'))) {
    execSync('git pull', { cwd: repoDir, stdio: 'ignore' });
  } else {
    execSync(`git clone ${REPO_CLONE_URL}`, { cwd: process.cwd(), stdio: 'ignore' });
  }
  return repoDir;
}

function readFromLocalRepo(key) {
  const relPath = REPO_PATHS[key];
  if (!relPath) throw new Error(`No repo path mapped for key: "${key}"`);

  const repoDir = ensureLocalRepo();
  const filePath = path.join(repoDir, relPath);

  if (!fs.existsSync(filePath)) throw new Error(`File not found in local repo: ${filePath}`);
  return filePath;
}

async function fetchFromGithub(key) {
  const url = URLS[key];
  if (!url) throw new Error(`Unknown github resource key: "${key}"`);

  const ext = path.extname(url) || '.tmp';
  const filename = path.basename(url);
  ensureCacheDir();

  // --- Rate-limit cooldown active: serve from local repo ---
  const rateLimitTs = getRateLimitTimestamp();
  if (rateLimitTs !== null) {
    const elapsed = Date.now() - rateLimitTs;
    if (elapsed < RATE_LIMIT_COOLDOWN_MS) {
      console.warn(`⚠  Fetch for "${filename}" failed previously (rate limited). Reading from local repo.`);
      return readFromLocalRepo(key);
    } else {
      // Cooldown expired — clear flag, fall through to normal fetch
      clearRateLimit();
    }
  }

  // --- Check cache ---
  const cached = getCachedFile(key, ext);
  if (cached) return cached;

  // --- Fetch from GitHub ---
  try {
    return await downloadToCache(key, url, ext);
  } catch (err) {
    if (err.code === 'RATE_LIMITED') {
      markRateLimited();
      console.warn(`⚠  Fetch for "${filename}" failed (429 rate limited). Found rate limit — reading from local repo.`);
      return readFromLocalRepo(key);
    }
    throw err;
  }
}

module.exports = { fetchFromGithub, URLS };
