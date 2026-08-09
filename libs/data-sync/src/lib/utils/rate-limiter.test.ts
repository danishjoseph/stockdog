import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('enforces a minimum delay between requests', async () => {
    const limiter = new RateLimiter({ minDelayMs: 50, maxConcurrency: 1 });
    const start = Date.now();
    await limiter.run(() => Promise.resolve());
    await limiter.run(() => Promise.resolve());
    await limiter.run(() => Promise.resolve());
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('retries failed requests up to maxRetries', async () => {
    const limiter = new RateLimiter({
      maxRetries: 2,
      baseDelayMs: 10,
      backoffFactor: 1,
      jitterMs: 0,
      minDelayMs: 0,
    });
    let calls = 0;
    await limiter
      .run(() => {
        calls++;
        throw new Error('boom');
      })
      .catch(() => undefined);
    expect(calls).toBe(3);
  });

  it('propagates the error after exhausting retries', async () => {
    const limiter = new RateLimiter({
      maxRetries: 1,
      baseDelayMs: 10,
      backoffFactor: 1,
      jitterMs: 0,
      minDelayMs: 0,
    });
    await expect(
      limiter.run(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
  });

  it('limits concurrency to maxConcurrency', async () => {
    const limiter = new RateLimiter({ maxConcurrency: 2, minDelayMs: 0 });
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 10 }, () =>
      limiter.run(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
      }),
    );
    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
