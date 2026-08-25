// Minimal in-memory cache with TTL.
//
// Alpha Vantage's free tier allows only 25 requests/day and 5/minute, so
// StockScope caches every response for a few minutes. This keeps the app
// responsive and avoids burning through the daily quota when a user
// re-opens the same stock or the dashboard reloads.

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

module.exports = { get, set };
