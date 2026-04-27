import "server-only";

const DEFAULT_RPM = Number(process.env.RATE_LIMIT_RPM || 20);
const WINDOW_MS = 60_000;

// In-memory bucket. For multi-instance prod, swap with Upstash/Redis.
const buckets = new Map();

function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Throws a Response (status 429) if the (ip, key) tuple has exceeded its
 * per-minute quota. Returns silently otherwise.
 */
export class RateLimitError extends Error {
  constructor(retryAfterSec) {
    super("Rate limit exceeded.");
    this.status = 429;
    this.retryAfterSec = retryAfterSec;
  }
}

export function rateLimit(req, key = "default", rpm = DEFAULT_RPM) {
  const id = `${clientIp(req)}::${key}`;
  const now = Date.now();
  const entry = buckets.get(id) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  buckets.set(id, entry);
  if (entry.count > rpm) {
    const retry = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    throw new RateLimitError(retry);
  }
  return {
    remaining: Math.max(0, rpm - entry.count),
    resetAt: entry.resetAt,
  };
}

/** Wrap a Response with rate-limit headers. */
export function withRateLimitHeaders(res, info) {
  if (!info) return res;
  res.headers.set("x-ratelimit-remaining", String(info.remaining));
  res.headers.set("x-ratelimit-reset", String(Math.floor(info.resetAt / 1000)));
  return res;
}

/** Periodically clear out old buckets so memory doesn't grow forever. */
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of buckets.entries()) {
    if (now > entry.resetAt + WINDOW_MS) buckets.delete(id);
  }
}, 5 * 60_000).unref?.();
