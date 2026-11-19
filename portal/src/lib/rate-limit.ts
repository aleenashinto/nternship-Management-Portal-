// In-memory sliding window limiter. Swap for Redis when running multiple instances.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  hits.delete(key);
}
