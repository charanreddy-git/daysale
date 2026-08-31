const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

const hits = new Map();

function rateLimiter(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  let entry = hits.get(key);
  if (!entry || now - entry.reset > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
    hits.set(key, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
    return;
  }

  next();
}

module.exports = { rateLimiter };
