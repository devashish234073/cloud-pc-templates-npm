const http = require('http');
const readline = require('readline');
const { getEndpoint, getLoginMode, getLoginModes } = require('./loginModes');

const EXIT_COMMANDS = new Set(['quit', 'exit', 'bye', 'done']);

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
      return true;
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
    return false;
  } catch (error) {
    console.error(`Error validating model for ${loginMode.mode}: ${error.message}`);
    console.error(`Endpoint: ${getEndpoint(loginMode, 'modelsPath')}`);
    process.exitCode = 1;
    return false;
  }
}

function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  let closed = false;
  let pendingResolve = null;

  rl.on('close', () => {
    closed = true;

    if (pendingResolve) {
      pendingResolve(null);
      pendingResolve = null;
    }
  });

  return {
    ask(question) {
      return new Promise((resolve) => {
        if (closed) {
          resolve(null);
          return;
        }

        pendingResolve = resolve;
        rl.question(question, (answer) => {
          pendingResolve = null;
          resolve(answer);
        });
      });
    },
    close() {
      if (!closed) {
        rl.close();
      }
    }
  };
}

function parseStreamChunk(chunk, onContent) {
  const lines = chunk.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith('data:')) {
      return;
    }

    const payload = trimmedLine.slice(5).trim();

    if (!payload || payload === '[DONE]') {
      return;
    }

    try {
      const parsed = JSON.parse(payload);
      const content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;

      if (content) {
        onContent(content);
      }
    } catch (error) {
      // Ignore incomplete stream fragments; the next chunk may complete them.
    }
  });
}

function sendChatCompletion(loginMode, modelName, messages) {
  return new Promise((resolve, reject) => {
    const endpoint = new URL(getEndpoint(loginMode, 'chatPath'));
    const payload = JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.5,
      top_p: 0.7,
      stream: true
    });

    const request = http.request(
      {
        hostname: endpoint.hostname,
        port: endpoint.port,
        path: endpoint.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let assistantResponse = '';
        let buffer = '';

        if (res.statusCode < 200 || res.statusCode >= 300) {
          let errorBody = '';

          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            errorBody += chunk;
          });
          res.on('end', () => {
            reject(new Error(`Request failed with status ${res.statusCode}${errorBody ? `: ${errorBody}` : ''}`));
          });
          return;
        }

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          buffer += chunk;

          const lastSeparator = buffer.lastIndexOf('\n\n');
          if (lastSeparator === -1) {
            return;
          }

          const completeChunk = buffer.slice(0, lastSeparator);
          buffer = buffer.slice(lastSeparator + 2);

          parseStreamChunk(completeChunk, (content) => {
            assistantResponse += content;
            process.stdout.write(content);
          });
        });
        res.on('end', () => {
          if (buffer.trim()) {
            parseStreamChunk(buffer, (content) => {
              assistantResponse += content;
              process.stdout.write(content);
            });
          }

          process.stdout.write('\n');
          resolve(assistantResponse);
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function startInteractiveChat(loginMode, modelName) {
  const prompt = createPrompt();
  const messages = [];

  console.log('');
  console.log(`Interactive chat started for ${loginMode.mode}/${modelName}.`);
  console.log('Type quit, exit, bye, or done to end.');
  console.log('');

  try {
    while (true) {
      const question = await prompt.ask('You: ');

      if (question === null) {
        console.log('Chat ended.');
        break;
      }

      const trimmedQuestion = question.trim();

      if (EXIT_COMMANDS.has(trimmedQuestion.toLowerCase())) {
        console.log('Chat ended.');
        break;
      }

      if (!trimmedQuestion) {
        continue;
      }

      messages.push({
        role: 'user',
        content: trimmedQuestion
      });

      process.stdout.write('Assistant: ');

      try {
        const assistantResponse = await sendChatCompletion(loginMode, modelName, messages);

        messages.push({
          role: 'assistant',
          content: assistantResponse
        });
      } catch (error) {
        messages.pop();
        console.error(`Error: ${error.message}`);
      }
    }
  } finally {
    prompt.close();
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
  const isValidModel = await validateModel(loginMode, modelName);

  if (isValidModel) {
    await startInteractiveChat(loginMode, modelName);
  }
}

module.exports = {
  aiChat,
  fetchJson,
  getModelsForLoginMode,
  parseModels,
  sendChatCompletion,
  showLoginModes,
  startInteractiveChat,
  validateModel
};
