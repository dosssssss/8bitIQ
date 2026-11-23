const { ApiError } = require('../utils/apiError');

// A small in-memory limiter, one counter per client IP. It resets when the
// server restarts, which is fine for slowing down password guessing.
// By default every request through check() counts. With countOnly: 'failures'
// only calls to fail(req) count, and clear(req) forgives the client.
function createRateLimiter({ windowMs, max, message, countOnly = 'all' }) {
  const hits = new Map(); // ip -> { count, resetAt }

  function entry(req, now) {
    const ip = req.ip || 'unknown';
    let e = hits.get(ip);
    if (!e || e.resetAt <= now) {
      e = { count: 0, resetAt: now + windowMs };
      hits.set(ip, e);
    }
    return e;
  }

  function prune(now) {
    if (hits.size < 1000) return;
    for (const [ip, e] of hits) if (e.resetAt <= now) hits.delete(ip);
  }

  function check(req, res, next) {
    const now = Date.now();
    prune(now);
    const e = entry(req, now);

    if (e.count >= max) {
      const retryAfter = Math.ceil((e.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return next(new ApiError(429, message, { retryAfter }));
    }
    if (countOnly === 'all') e.count += 1;
    next();
  }

  function fail(req) {
    entry(req, Date.now()).count += 1;
  }

  function clear(req) {
    hits.delete(req.ip || 'unknown');
  }

  function reset() {
    hits.clear();
  }

  return { check, fail, clear, reset };
}

module.exports = { createRateLimiter };