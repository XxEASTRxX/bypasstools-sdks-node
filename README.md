# bypasstools

Official Node.js SDK for the [BypassTools](https://bypass.tools) API — the fastest way to bypass link shorteners programmatically.

**Links:** [bypass.tools](https://bypass.tools) · [API Dashboard](https://bypass.tools/dashboard) · [eas.lol](https://eas.lol)

## Installation

```bash
npm install bypasstools
```

## Quick Start

```js
const { BypassTools } = require('bypasstools');

const client = new BypassTools({ apiKey: 'bt_your_key_here' });

const { resultUrl } = await client.bypass('https://linkvertise.com/example');
console.log(resultUrl);
```

## Authentication

Get your API key from your [dashboard](https://bypass.tools/dashboard/keys).

## Methods

### `bypass(url, options?) → Promise<BypassResult>`
Calls the direct bypass endpoint and waits for the result.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `refresh` | `boolean` | `false` | Skip cache and force a fresh bypass |

**Returns:** `{ resultUrl, cached, processTime, requestId }`

```js
const { resultUrl, cached, processTime } = await client.bypass(
    'https://linkvertise.com/example',
    { refresh: false }
);
```

---

### `bypassAsync(url, options?) → Promise<{ resultUrl, taskId }>`
Creates a task and polls until it completes (or times out). Non-blocking alternative.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollInterval` | `number` (ms) | `1500` | Time between status polls |
| `timeout` | `number` (ms) | `90000` | Max wait time before error |

```js
const { resultUrl, taskId } = await client.bypassAsync(
    'https://loot.link/example',
    { pollInterval: 1500, timeout: 90000 }
);
```

---

### `createTask(url) → Promise<{ taskId }>`
Creates an async task and returns immediately with a `taskId`.

```js
const { taskId } = await client.createTask('https://loot.link/example');
```

---

### `getTaskResult(taskId) → Promise<TaskResult>`
Fetches the current status of a task.

**Returns:** `{ status, resultUrl?, error? }`  
`status` is one of: `pending` · `processing` · `completed` · `failed`

```js
const result = await client.getTaskResult(taskId);
if (result.status === 'completed') {
    console.log(result.resultUrl);
}
```

---

## Constructor Options

```js
const client = new BypassTools({
    apiKey:  'bt_your_key_here',   // required
    baseUrl: 'https://api.bypass.tools/api/v1', // optional override
    timeout: 60000,                // ms, default 60s
});
```

## Error Handling

```js
const { BypassTools, BypassToolsError } = require('bypasstools');

try {
    const { resultUrl } = await client.bypass('https://linkvertise.com/example');
} catch (err) {
    if (err instanceof BypassToolsError) {
        console.log(err.code);    // 'QUOTA_EXCEEDED', 'RATE_LIMITED', 'TIMEOUT', etc.
        console.log(err.status);  // HTTP status code (401, 403, 429, 500...)
        console.log(err.message); // human-readable message
    }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_API_KEY` | 401 | No API key provided |
| `INVALID_API_KEY` | 401 | Key not found or suspended |
| `QUOTA_EXCEEDED` | 403 | Account request quota used up |
| `ACCOUNT_EXPIRED` | 403 | Time-based subscription expired |
| `RATE_LIMITED` | 429 | Too many requests, slow down |
| `TIMEOUT` | — | Request exceeded timeout |
| `TASK_FAILED` | — | Async task failed to complete |
| `TASK_TIMEOUT` | — | Polling timed out waiting for result |

## TypeScript

TypeScript types are included — no `@types/` package needed.

```ts
import { BypassTools, BypassToolsError, BypassResult } from 'bypasstools';

const client = new BypassTools({ apiKey: 'bt_your_key_here' });
const result: BypassResult = await client.bypass('https://linkvertise.com/example');
```

## License

MIT — built by [EAS](https://eas.lol) · [bypass.tools](https://bypass.tools)
