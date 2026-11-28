const params = new URLSearchParams(location.search);
const route = params.get('route') || '';
const title = document.getElementById('title');
const modelSelect = document.getElementById('model');
const prompt = document.getElementById('prompt');
const streaming = document.getElementById('streaming');
const output = document.getElementById('output');
const sendButton = document.getElementById('send');
const refreshButton = document.getElementById('refresh');

title.textContent = `${params.get('name') || route} Route Tester`;

async function loadModels() {
  modelSelect.disabled = true;
  modelSelect.innerHTML = '<option>Loading models...</option>';
  try {
    const response = await fetch(`/${route}/v1/models`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

    const models = data.data || data.models || [];
    modelSelect.innerHTML = '';
    if (!models.length) {
      modelSelect.innerHTML = '<option value="">No models reported</option>';
      return;
    }
    models.forEach(model => {
      const id = typeof model === 'string' ? model : model.id || model.name;
      if (id) modelSelect.add(new Option(id, id));
    });
  } catch (error) {
    modelSelect.innerHTML = '<option value="">Model discovery unavailable</option>';
    output.textContent = `Could not load models:\n${error.message}`;
  } finally {
    modelSelect.disabled = false;
  }
}

function extractText(payload) {
  const choices = payload?.choices;
  if (!choices?.length) {
    if (payload?.error) return `Error: ${payload.error}`;
    return payload?.message?.content || payload?.content || '';
  }

  const choice = choices[0];
  return choice?.message?.content || choice?.delta?.content || choice?.text || '';
}

async function sendTest() {
  const model = modelSelect.value;
  if (!model) {
    output.textContent = 'Choose a model before sending the test.';
    return;
  }

  sendButton.disabled = true;
  output.textContent = 'Sending...';

  const body = {
    model,
    messages: [{ role: 'user', content: prompt.value }],
    stream: streaming.checked,
    temperature: 0.2
  };

  try {
    const response = await fetch(`/${route}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!streaming.checked) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      output.textContent = extractText(data);
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error('This response has no readable stream body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    output.textContent = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        const line = frame.split('\n').find(part => part.startsWith('data:'));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const payload = JSON.parse(data);
          if (payload.error) output.textContent += `\nError: ${payload.error}`;
          else output.textContent += extractText(payload);
        } catch {
          output.textContent += data;
        }
      }
      if (done) break;
    }
  } catch (error) {
    output.textContent = `Request failed:\n${error.message}`;
  } finally {
    sendButton.disabled = false;
  }
}

refreshButton.addEventListener('click', loadModels);
sendButton.addEventListener('click', sendTest);
loadModels();
