const http = require('http');
const { getEndpoint, getLoginMode, getLoginModes } = require('./loginModes');

function fetchJson(endpoint, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const request = http.request(endpoint, { method: 'GET', timeout: timeoutMs }, (res) => {
      let body = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Request failed with status ${res.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timed out'));
    });

    request.on('error', reject);
    request.end();
  });
}

function parseModels(response) {
  if (!response || !Array.isArray(response.data)) {
    return [];
  }

  return response.data
    .map((model) => model && model.id)
    .filter(Boolean);
}

async function getModelsForLoginMode(loginMode) {
  const endpoint = getEndpoint(loginMode, 'modelsPath');
  const response = await fetchJson(endpoint);

  return {
    endpoint,
    models: parseModels(response)
  };
}

function showLoginModes() {
  console.log('Available login modes for chat:');
  console.log('');

  getLoginModes().forEach((loginMode) => {
    console.log(`  ${loginMode.mode.padEnd(20)} - ${loginMode.description}`);
  });
  console.log('');
  console.log('Run: npx cloud-pc-templates ai chat <loginmode>');
}

async function listModelsForLoginMode(loginModeName) {
  const loginMode = getLoginMode(loginModeName);

  if (!loginMode) {
    return false;
  }

  try {
    const { endpoint, models } = await getModelsForLoginMode(loginMode);

    console.log(`Available models for ${loginMode.mode}:`);
    console.log(`Endpoint: ${endpoint}`);
    console.log('');

    if (models.length === 0) {
      console.log('No models found.');
    } else {
      models.forEach((model) => {
        console.log(`  - ${model}`);
      });
    }

    console.log('');
    console.log(`Run: npx cloud-pc-templates ai chat ${loginMode.mode} <model-name>`);
  } catch (error) {
    console.error(`Error fetching models for ${loginMode.mode}: ${error.message}`);
    console.error(`Endpoint: ${getEndpoint(loginMode, 'modelsPath')}`);
    process.exitCode = 1;
  }

  return true;
}

async function validateModel(loginMode, modelName) {
  try {
    const { models } = await getModelsForLoginMode(loginMode);

    if (models.includes(modelName)) {
      console.log(`✓ Model "${modelName}" is available for ${loginMode.mode}.`);
      return;
    }

    console.error(`Error: "${modelName}" is not a valid model for ${loginMode.mode}.`);

    if (models.length > 0) {
      console.error('');
      console.error(`Available models for ${loginMode.mode}:`);
      models.forEach((model) => {
        console.error(`  - ${model}`);
      });
    } else {
      console.error(`No models found for ${loginMode.mode}.`);
    }

    process.exitCode = 1;
  } catch (error) {
    console.error(`Error validating model for ${loginMode.mode}: ${error.message}`);
    console.error(`Endpoint: ${getEndpoint(loginMode, 'modelsPath')}`);
    process.exitCode = 1;
  }
}

async function aiChat(remainingArgs) {
  if (!remainingArgs || remainingArgs.length === 0) {
    showLoginModes();
    return;
  }

  const loginModeName = remainingArgs[0];
  const loginMode = getLoginMode(loginModeName);

  if (!loginMode) {
    console.error(`Error: "${loginModeName}" is not a valid login mode.`);
    console.error('');
    showLoginModes();
    process.exitCode = 1;
    return;
  }

  if (remainingArgs.length === 1) {
    await listModelsForLoginMode(loginModeName);
    return;
  }

  const modelName = remainingArgs.slice(1).join(' ');
  await validateModel(loginMode, modelName);
}

module.exports = {
  aiChat,
  fetchJson,
  getModelsForLoginMode,
  parseModels,
  showLoginModes,
  validateModel
};
