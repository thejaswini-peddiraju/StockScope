const express = require('express');
const { searchSymbol, getQuote, getDailyHistory } = require('../services/alphaVantage');
const { FALLBACK_STOCKS } = require('../data/fallbackStocks');

const router = express.Router();

// GET /api/stocks/popular — a browsable list of supported stocks (used by
// the Explore page). This is always served from the curated list rather
// than Alpha Vantage, since SYMBOL_SEARCH requires a query and Alpha
// Vantage has no "browse everything" endpoint on the free tier.
router.get('/popular', (req, res) => {
  res.json({
    results: FALLBACK_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
    })),
  });
});

// GET /api/stocks/search?q=reliance
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const result = await searchSymbol(query);
    res.json(result);
  } catch (err) {
    console.error('Search route error:', err.message);
    res.status(500).json({ error: 'Failed to search stocks.' });
  }
});

// GET /api/stocks/quote/:symbol
router.get('/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const quote = await getQuote(symbol);
    if (!quote) {
      return res.status(404).json({ error: `No quote found for symbol "${symbol}".` });
    }
    res.json(quote);
  } catch (err) {
    console.error('Quote route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quote.' });
  }
});

// GET /api/stocks/history/:symbol
router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await getDailyHistory(symbol);
    if (!result) {
      return res.status(404).json({ error: `No history found for symbol "${symbol}".` });
    }
    res.json(result);
  } catch (err) {
    console.error('History route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch price history.' });
  }
});

module.exports = router;
