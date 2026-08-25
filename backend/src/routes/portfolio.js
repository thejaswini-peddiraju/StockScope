const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getPortfolio, savePortfolio } = require('../services/db');
const { getQuote } = require('../services/alphaVantage');

const router = express.Router();

router.use(authenticateToken);

// GET /api/portfolio — holdings, cash, and computed current value/P&L per holding
router.get('/', async (req, res) => {
  const portfolio = getPortfolio(req.user.id);
  const symbols = Object.keys(portfolio.holdings);

  try {
    const quotes = await Promise.all(
      symbols.map((symbol) => getQuote(symbol).catch(() => null))
    );

    const holdings = symbols.map((symbol, i) => {
      const h = portfolio.holdings[symbol];
      const quote = quotes[i];
      const currentPrice = quote ? quote.price : h.avgPrice;
      const currentValue = +(currentPrice * h.shares).toFixed(2);
      const costBasis = +(h.avgPrice * h.shares).toFixed(2);
      const profitLoss = +(currentValue - costBasis).toFixed(2);
      const profitLossPercent = costBasis ? +((profitLoss / costBasis) * 100).toFixed(2) : 0;

      return {
        symbol,
        shares: h.shares,
        avgPrice: h.avgPrice,
        currentPrice,
        currentValue,
        costBasis,
        profitLoss,
        profitLossPercent,
      };
    });

    const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalValue = +(portfolio.cash + holdingsValue).toFixed(2);
    const totalProfitLoss = +(holdingsValue - totalCostBasis).toFixed(2);

    res.json({
      cash: +portfolio.cash.toFixed(2),
      holdings,
      holdingsValue: +holdingsValue.toFixed(2),
      totalValue,
      totalProfitLoss,
      transactions: portfolio.transactions.slice(-20).reverse(),
    });
  } catch (err) {
    console.error('Portfolio fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load portfolio.' });
  }
});

// POST /api/portfolio/buy { symbol, shares }
router.post('/buy', async (req, res) => {
  const { symbol, shares } = req.body || {};
  const qty = Number(shares);

  if (!symbol || !qty || qty <= 0) {
    return res.status(400).json({ error: 'Symbol and a positive share quantity are required.' });
  }

  const portfolio = getPortfolio(req.user.id);
  const quote = await getQuote(symbol).catch(() => null);
  if (!quote) {
    return res.status(404).json({ error: `Could not get a price for "${symbol}".` });
  }

  const cost = +(quote.price * qty).toFixed(2);
  if (cost > portfolio.cash) {
    return res.status(400).json({
      error: `Insufficient cash. This purchase costs ₹${cost.toLocaleString('en-IN')}, you have ₹${portfolio.cash.toLocaleString('en-IN')}.`,
    });
  }

  const existing = portfolio.holdings[symbol];
  if (existing) {
    const totalShares = existing.shares + qty;
    const totalCost = existing.avgPrice * existing.shares + cost;
    existing.shares = totalShares;
    existing.avgPrice = +(totalCost / totalShares).toFixed(2);
  } else {
    portfolio.holdings[symbol] = { shares: qty, avgPrice: quote.price };
  }

  portfolio.cash = +(portfolio.cash - cost).toFixed(2);
  portfolio.transactions.push({
    type: 'buy',
    symbol,
    shares: qty,
    price: quote.price,
    total: cost,
    timestamp: new Date().toISOString(),
  });

  savePortfolio(req.user.id, portfolio);
  res.status(201).json({ message: `Bought ${qty} share(s) of ${symbol}.`, cash: portfolio.cash });
});

// POST /api/portfolio/sell { symbol, shares }
router.post('/sell', async (req, res) => {
  const { symbol, shares } = req.body || {};
  const qty = Number(shares);

  if (!symbol || !qty || qty <= 0) {
    return res.status(400).json({ error: 'Symbol and a positive share quantity are required.' });
  }

  const portfolio = getPortfolio(req.user.id);
  const existing = portfolio.holdings[symbol];

  if (!existing || existing.shares < qty) {
    return res.status(400).json({
      error: `You only hold ${existing ? existing.shares : 0} share(s) of ${symbol}.`,
    });
  }

  const quote = await getQuote(symbol).catch(() => null);
  if (!quote) {
    return res.status(404).json({ error: `Could not get a price for "${symbol}".` });
  }

  const proceeds = +(quote.price * qty).toFixed(2);
  existing.shares -= qty;
  if (existing.shares === 0) {
    delete portfolio.holdings[symbol];
  }

  portfolio.cash = +(portfolio.cash + proceeds).toFixed(2);
  portfolio.transactions.push({
    type: 'sell',
    symbol,
    shares: qty,
    price: quote.price,
    total: proceeds,
    timestamp: new Date().toISOString(),
  });

  savePortfolio(req.user.id, portfolio);
  res.json({ message: `Sold ${qty} share(s) of ${symbol}.`, cash: portfolio.cash });
});

module.exports = router;
