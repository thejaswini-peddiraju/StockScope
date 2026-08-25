require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stocksRouter = require('./routes/stocks');
const authRouter = require('./routes/auth');
const watchlistRouter = require('./routes/watchlist');
const portfolioRouter = require('./routes/portfolio');
const { hasApiKey } = require('./services/alphaVantage');

function createApp() {
  const app = express();
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      apiKeyConfigured: hasApiKey(),
      note: hasApiKey()
        ? 'Live Alpha Vantage data enabled.'
        : 'No ALPHA_VANTAGE_API_KEY set — serving fallback demo data. See backend/.env.example.',
    });
  });

  app.use('/api/stocks', stocksRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/watchlist', watchlistRouter);
  app.use('/api/portfolio', portfolioRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`StockScope backend running on http://localhost:${PORT}`);
    console.log(
      hasApiKey()
        ? 'Alpha Vantage API key detected — live market data enabled.'
        : 'No Alpha Vantage API key set — serving fallback demo data (see backend/.env.example).'
    );
  });
}

module.exports = { createApp };

