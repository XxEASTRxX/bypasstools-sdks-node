export declare class BypassToolsError extends Error {
    code: string;
    status: number;
    constructor(message: string, code?: string, status?: number);
}

export interface BypassToolsOptions {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}

export interface BypassResult {
    resultUrl: string;
    cached: boolean;
    processTime: number;
    requestId: string;
}

export interface TaskResult {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
}

export interface AsyncBypassResult {
    resultUrl: string;
    taskId: string;
}

export declare class BypassTools {
    constructor(options: BypassToolsOptions);

    /** Bypass a URL synchronously and return the result. */
    bypass(url: string, options?: { refresh?: boolean }): Promise<BypassResult>;

    /** Create an async bypass task and return its taskId. */
    createTask(url: string): Promise<{ taskId: string }>;

    /** Get the result of an existing task. */
    getTaskResult(taskId: string): Promise<TaskResult>;

    /** Create a task and poll until complete. */
    bypassAsync(url: string, options?: { pollInterval?: number; timeout?: number }): Promise<AsyncBypassResult>;
}
