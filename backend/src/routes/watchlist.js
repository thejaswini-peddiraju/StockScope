const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getWatchlist, setWatchlist } = require('../services/db');

const router = express.Router();

// All watchlist routes require a logged-in user.
router.use(authenticateToken);

// GET /api/watchlist
router.get('/', (req, res) => {
  res.json({ symbols: getWatchlist(req.user.id) });
});

// POST /api/watchlist  { symbol }
router.post('/', (req, res) => {
  const { symbol } = req.body || {};
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required.' });
  }

  const current = getWatchlist(req.user.id);
  if (current.includes(symbol)) {
    return res.json({ symbols: current });
  }

  const updated = [...current, symbol];
  setWatchlist(req.user.id, updated);
  res.status(201).json({ symbols: updated });
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', (req, res) => {
  const current = getWatchlist(req.user.id);
  const updated = current.filter((s) => s !== req.params.symbol);
  setWatchlist(req.user.id, updated);
  res.json({ symbols: updated });
});

module.exports = router;
