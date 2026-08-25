const axios = require('axios');
const cache = require('./cache');
const {
  findFallbackStock,
  searchFallback,
  buildFallbackQuote,
  buildFallbackHistory,
} = require('../data/fallbackStocks');

const BASE_URL = 'https://www.alphavantage.co/query';

// Supports one or two API keys. A second key is used only as a genuine
// failover — if the primary key is out of quota or erroring — not as a
// way to actively split traffic. Set ALPHA_VANTAGE_API_KEY_BACKUP in .env
// to enable it.
const API_KEYS = [process.env.ALPHA_VANTAGE_API_KEY, process.env.ALPHA_VANTAGE_API_KEY_BACKUP]
  .filter((key) => key && key !== 'your_api_key_here');

function hasApiKey() {
  return API_KEYS.length > 0;
}

// Alpha Vantage returns HTTP 200 even when the quota is exhausted or the
// key is invalid — the failure shows up inside the JSON body instead of as
// an HTTP error. This checks for those cases so callers can fall back.
// It also logs the exact message, since this path fails silently otherwise
// (no HTTP error is thrown, so nothing shows up unless we log it here).
function isQuotaOrErrorResponse(data, context) {
  if (!data) return true;
  if (data.Note) {
    console.warn(`Alpha Vantage quota/rate-limit hit (${context}):`, data.Note);
    return true;
  }
  if (data.Information) {
    console.warn(`Alpha Vantage returned an Information message (${context}):`, data.Information);
    return true;
  }
  if (data['Error Message']) {
    console.warn(`Alpha Vantage error (${context}):`, data['Error Message']);
    return true;
  }
  return false;
}

// Tries each configured key in order, moving to the next only if the
// current one is out of quota, invalid, or errors at the network level.
// Returns the first usable response, or null if every key failed.
async function fetchWithKeyFailover(params, context) {
  for (const apiKey of API_KEYS) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: { ...params, apikey: apiKey },
        timeout: 8000,
      });

      if (!isQuotaOrErrorResponse(data, `${context} [key ending ...${apiKey.slice(-4)}]`)) {
        return data;
      }
      // This key is out of quota/invalid — loop continues to the next key.
    } catch (err) {
      console.error(`Alpha Vantage request failed (${context}):`, err.message);
      // Network-level failure — still try the next key before giving up.
    }
  }
  return null;
}

async function searchSymbol(query) {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (hasApiKey()) {
    const data = await fetchWithKeyFailover(
      { function: 'SYMBOL_SEARCH', keywords: query },
      `search "${query}"`
    );

    if (data && Array.isArray(data.bestMatches)) {
      const results = data.bestMatches.slice(0, 10).map((m) => ({
        symbol: m['1. symbol'],
        name: m['2. name'],
        region: m['4. region'],
      }));
      const payload = { results, source: 'alphavantage' };
      cache.set(cacheKey, payload, 10 * 60 * 1000);
      return payload;
    }
  }

  return { results: searchFallback(query), source: 'fallback' };
}

async function getQuote(symbol) {
  const cacheKey = `quote:${symbol.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (hasApiKey()) {
    const data = await fetchWithKeyFailover({ function: 'GLOBAL_QUOTE', symbol }, `quote "${symbol}"`);
    const q = data && data['Global Quote'];

    if (q && q['01. symbol']) {
      const payload = {
        symbol: q['01. symbol'],
        price: parseFloat(q['05. price']),
        change: parseFloat(q['09. change']),
        changePercent: parseFloat((q['10. change percent'] || '0%').replace('%', '')),
        open: parseFloat(q['02. open']),
        high: parseFloat(q['03. high']),
        low: parseFloat(q['04. low']),
        previousClose: parseFloat(q['08. previous close']),
        volume: parseInt(q['06. volume'], 10),
        latestTradingDay: q['07. latest trading day'],
        source: 'alphavantage',
      };
      cache.set(cacheKey, payload, 3 * 60 * 1000);
      return payload;
    }
  }

  const fallbackStock = findFallbackStock(symbol);
  if (!fallbackStock) return null;
  return buildFallbackQuote(fallbackStock);
}

async function getDailyHistory(symbol) {
  const cacheKey = `history:${symbol.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (hasApiKey()) {
    const data = await fetchWithKeyFailover(
      { function: 'TIME_SERIES_DAILY', symbol, outputsize: 'compact' },
      `history "${symbol}"`
    );
    const series = data && data['Time Series (Daily)'];

    if (series) {
      const history = Object.entries(series)
        .map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'], 10),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-60);

      const payload = { history, source: 'alphavantage' };
      cache.set(cacheKey, payload, 15 * 60 * 1000);
      return payload;
    }
  }

  const fallbackStock = findFallbackStock(symbol);
  if (!fallbackStock) return null;
  return { history: buildFallbackHistory(fallbackStock), source: 'fallback' };
}

module.exports = { searchSymbol, getQuote, getDailyHistory, hasApiKey };