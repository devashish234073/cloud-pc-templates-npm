# JS Proxies Express

Cloud Pc Templates server that exposes the existing proxy vendors on different prefixes.

## Start

Run these commands from the root `cloud-pc-templates` directory:

```bash
npm install
npm start
```

The Express backend is a subproject and uses the root `package.json` and root `node_modules`.

Open `http://localhost:3000`. All vendor routes are OFF initially.

Set `PORT` to change the port. API keys can be entered from the dashboard or supplied through environment variables:

- `DEEPSEEK_API_KEY`
- `HF_TOKEN`
- `SARVAM_API_KEY`
- `OLLAMA_API_KEY`

Ollama Local does not require an API key and expects an Ollama server on `localhost:11434`.

## Routes

- `/deepseek/v1/models`
- `/deepseek/v1/chat/completions`
- `/huggingface/v1/models`
- `/huggingface/v1/chat/completions`
- `/sarvam/v1/models`
- `/sarvam/v1/chat/completions`
- `/ollama/v1/models`
- `/ollama/v1/chat/completions`
- `/ollama/v1/web_search`
- `/ollamaoffline/v1/models`
- `/ollamaoffline/v1/chat/completions`
- `/ollamaoffline/v1/systemone`

Management API:

```text
GET  /api/routes/status
POST /api/routes/:id/enable   { "apiKey": "optional-key" }
POST /api/routes/:id/disable
```

Stop or check the server:

```bash
npm run stop
npm run status
```

You can also press Ctrl+C in the terminal while `npm start` is running.
