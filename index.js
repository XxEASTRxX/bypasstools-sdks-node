'use strict';

const DEFAULT_BASE_URL = 'https://api.bypass.tools/api/v1';
const DEFAULT_TIMEOUT  = 60_000;
const DEFAULT_POLL_INTERVAL = 1_500;
const DEFAULT_POLL_TIMEOUT  = 90_000;

class BypassToolsError extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = 'BypassToolsError';
        this.code = code || 'UNKNOWN_ERROR';
        this.status = status || 0;
    }
}

class BypassTools {
    /**
     * @param {object} options
     * @param {string} options.apiKey        - Your bt_ API key
     * @param {string} [options.baseUrl]     - Override base URL (default: https://api.bypass.tools/api/v1)
     * @param {number} [options.timeout]     - Request timeout in ms (default: 60000)
     */
    constructor(options = {}) {
        if (!options.apiKey) throw new BypassToolsError('apiKey is required', 'MISSING_API_KEY');
        this._apiKey  = options.apiKey;
        this._base    = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
        this._timeout = options.timeout || DEFAULT_TIMEOUT;
    }

    // ─── Private helpers ────────────────────────────────────────────────

    async _request(method, path, { body, query } = {}) {
        const url = new URL(this._base + path);
        if (query) Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this._timeout);

        let res;
        try {
            res = await fetch(url.toString(), {
                method,
                headers: {
                    'x-api-key': this._apiKey,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
        } catch (err) {
            if (err.name === 'AbortError') throw new BypassToolsError('Request timed out', 'TIMEOUT');
            throw new BypassToolsError(err.message, 'NETWORK_ERROR');
        } finally {
            clearTimeout(timer);
        }

        let data;
        try { data = await res.json(); } catch { data = {}; }

        if (!res.ok) {
            throw new BypassToolsError(
                data.message || `HTTP ${res.status}`,
                data.code    || 'API_ERROR',
                res.status
            );
        }
        return data;
    }

    _sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Bypass a URL directly (synchronous — waits for result).
     *
     * @param {string} url         - The URL to bypass
     * @param {object} [options]
     * @param {boolean} [options.refresh=false] - Skip cache and force fresh bypass
     * @returns {Promise<{ resultUrl: string, cached: boolean, processTime: number, requestId: string }>}
     */
    async bypass(url, options = {}) {
        if (!url) throw new BypassToolsError('url is required', 'MISSING_URL');
        const data = await this._request('POST', '/bypass/direct', {
            body: { url, refresh: options.refresh ?? false },
        });
        return {
            resultUrl:   data.result,
            cached:      data.cached ?? false,
            processTime: data.processTime,
            requestId:   data.requestId,
        };
    }

    /**
     * Create a bypass task (async — returns immediately with a taskId).
     * Use {@link getTaskResult} or {@link waitForTask} to retrieve the result.
     *
     * @param {string} url
     * @returns {Promise<{ taskId: string }>}
     */
    async createTask(url) {
        if (!url) throw new BypassToolsError('url is required', 'MISSING_URL');
        const data = await this._request('POST', '/bypass/createTask', { body: { url } });
        return { taskId: data.taskId };
    }

    /**
     * Poll a task for its result.
     *
     * @param {string} taskId
     * @returns {Promise<{ status: string, resultUrl?: string, error?: string }>}
     */
    async getTaskResult(taskId) {
        if (!taskId) throw new BypassToolsError('taskId is required', 'MISSING_TASK_ID');
        const data = await this._request('GET', `/bypass/getTaskResult/${taskId}`);
        return {
            status:    data.status,
            resultUrl: data.result,
            error:     data.error,
        };
    }

    /**
     * Create a task and poll until it completes (or times out).
     *
     * @param {string} url
     * @param {object} [options]
     * @param {number} [options.pollInterval=1500] - ms between polls
     * @param {number} [options.timeout=90000]     - total ms before giving up
     * @returns {Promise<{ resultUrl: string, taskId: string }>}
     */
    async bypassAsync(url, options = {}) {
        const { taskId } = await this.createTask(url);
        const interval  = options.pollInterval || DEFAULT_POLL_INTERVAL;
        const deadline  = Date.now() + (options.timeout || DEFAULT_POLL_TIMEOUT);

        while (Date.now() < deadline) {
            await this._sleep(interval);
            const result = await this.getTaskResult(taskId);
            if (result.status === 'completed') return { resultUrl: result.resultUrl, taskId };
            if (result.status === 'failed') throw new BypassToolsError(result.error || 'Task failed', 'TASK_FAILED');
        }
        throw new BypassToolsError('Task timed out waiting for result', 'TASK_TIMEOUT');
    }
}

module.exports = { BypassTools, BypassToolsError };
