export interface RateLimiterOptions {
  maxConcurrency: number;
  minDelayMs: number;
  maxRetries: number;
  baseDelayMs: number;
  backoffFactor: number;
  jitterMs: number;
}

const defaultOptions: RateLimiterOptions = {
  maxConcurrency: 1,
  minDelayMs: 1200,
  maxRetries: 3,
  baseDelayMs: 2000,
  backoffFactor: 2,
  jitterMs: 500,
};

export class RateLimiter {
  private readonly options: RateLimiterOptions;
  private active = 0;
  private readonly waiters: (() => void)[] = [];
  private nextAllowedAt = 0;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    try {
      return await this.executeWithRetry(fn);
    } finally {
      this.releaseSlot();
    }
  }

  private async acquireSlot(): Promise<void> {
    if (this.active < this.options.maxConcurrency) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active++;
  }

  private releaseSlot(): void {
    this.active--;
    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        await this.respectMinDelay();
        return await fn();
      } catch (error) {
        attempt++;
        if (attempt > this.options.maxRetries) {
          throw error;
        }
        await this.backoff(error, attempt);
      }
    }
  }

  private async respectMinDelay(): Promise<void> {
    const now = Date.now();
    const wait = this.nextAllowedAt - now;
    if (wait > 0) {
      await this.delay(wait);
    }
    this.nextAllowedAt =
      Math.max(this.nextAllowedAt, Date.now()) + this.options.minDelayMs;
  }

  private async backoff(error: unknown, attempt: number): Promise<void> {
    const retryAfterMs = this.getRetryAfterMs(error);
    const exponential =
      this.options.baseDelayMs *
      Math.pow(this.options.backoffFactor, attempt - 1);
    const jitter = Math.floor(Math.random() * this.options.jitterMs);
    await this.delay((retryAfterMs ?? exponential) + jitter);
  }

  private getRetryAfterMs(error: unknown): number | undefined {
    const response = (error as { response?: { status?: number; headers?: Record<string, string> } })?.response;
    const retryAfter = response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    if (response?.status === 429 || response?.status === 403) {
      return this.options.baseDelayMs * 2;
    }
    return undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
