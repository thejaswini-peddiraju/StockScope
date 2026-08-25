# StockScope 📈

A full-stack stock market analysis platform. Search for stocks, view live-ish quotes,
and explore historical price movement on an interactive dashboard.

**Frontend:** Angular 19 (standalone components)
**Backend:** Node.js + Express, integrating the [Alpha Vantage](https://www.alphavantage.co/) market data API

---

## What it does

- **Search** for stocks by name or symbol (debounced, live results as you type)
- **Dashboard** showing live-quoted "Top Gainers", "Top Losers", and a watchlist of
  Indian equities (BSE) and major US tickers
- **Stock detail page** per symbol: current price, day's open/high/low/previous close,
  volume, and a price-history line chart (Chart.js) over the last ~60 trading days
- **User accounts**: register/login with JWT auth, passwords hashed with bcrypt
- **Personal watchlist**: logged-in users can star any stock to save it, persisted
  server-side per user
- **Explore page**: browse all supported stocks
- **Compare page**: add up to 3 stocks and see their normalized (% change) price
  performance overlaid on one chart, plus a side-by-side stats table
- **Portfolio (paper trading)**: buy/sell stocks with ₹1,00,000 in virtual cash,
  track holdings, average cost, live profit/loss, and transaction history — real
  money is never involved, this is a simulation for practice/demo purposes
- **Insights**: charts summarizing your watchlist's daily performance and your
  portfolio's allocation by holding
- **Theming**: dark/light mode plus 4 accent colors, persisted per browser
- Graceful **fallback to demo data** if the Alpha Vantage API key isn't configured or
  its (very tight) free-tier rate limit is hit, so the app always demos cleanly —
  see [Fallback data](#fallback-data) below

## Architecture

```
StockScope/
├── src/                    # Angular frontend
│   └── app/
│       ├── pages/
│       │   ├── dashboard/       # Search + market movers + watchlist
│       │   ├── stock-details/   # Per-stock quote + price chart
│       │   ├── explore/         # Browse all supported stocks
│       │   ├── compare/         # Multi-stock comparison + overlay chart
│       │   ├── watchlist/       # Logged-in user's saved stocks
│       │   ├── login/, register/
│       │   └── placeholder/     # Portfolio/Insights/Settings (not yet built)
│       ├── services/
│       │   ├── stock.service.ts      # HTTP client for stock data
│       │   ├── auth.service.ts       # Login/register/session state
│       │   └── watchlist.service.ts  # Saved-stocks CRUD
│       ├── guards/auth.guard.ts      # Protects the Watchlist route
│       └── interceptors/auth.interceptor.ts  # Attaches JWT to requests
└── backend/                 # Express API server
    └── src/
        ├── server.js             # App entry point
        ├── routes/
        │   ├── stocks.js         # /api/stocks/* endpoints
        │   ├── auth.js           # /api/auth/* — register, login, me
        │   └── watchlist.js      # /api/watchlist/* — protected, per-user
        ├── middleware/auth.js    # JWT verification middleware
        ├── services/
        │   ├── alphaVantage.js   # Alpha Vantage integration + fallback logic
        │   ├── cache.js          # In-memory TTL cache (keeps within rate limits)
        │   └── db.js             # JSON-file persistence for users/watchlists
        └── data/fallbackStocks.js # Curated demo dataset used as a fallback
```

The frontend never calls Alpha Vantage directly — it talks to the Express backend,
which handles the third-party API call, caching, and fallback logic. This keeps the
API key server-side (never exposed to the browser) and centralizes rate-limit handling.

## API endpoints

| Method | Endpoint                        | Auth required | Description                          |
|--------|----------------------------------|:---:|---------------------------------------|
| GET    | `/api/health`                   |  | Server status + whether a live API key is configured |
| GET    | `/api/stocks/popular`           |  | Browsable list of supported stocks |
| GET    | `/api/stocks/search?q=reliance` |  | Search stocks by name or symbol      |
| GET    | `/api/stocks/quote/:symbol`     |  | Current quote for a symbol           |
| GET    | `/api/stocks/history/:symbol`   |  | Daily closing price history (~60 days) |
| POST   | `/api/auth/register`            |  | Create an account, returns a JWT |
| POST   | `/api/auth/login`               |  | Log in, returns a JWT |
| GET    | `/api/auth/me`                  | ✓ | Current user info |
| GET    | `/api/watchlist`                | ✓ | Get the logged-in user's saved symbols |
| POST   | `/api/watchlist`                | ✓ | Add a symbol `{ symbol }` |
| DELETE | `/api/watchlist/:symbol`        | ✓ | Remove a symbol |
| GET    | `/api/portfolio`                | ✓ | Cash, holdings, current values, P&L, recent transactions |
| POST   | `/api/portfolio/buy`            | ✓ | Buy shares `{ symbol, shares }` |
| POST   | `/api/portfolio/sell`           | ✓ | Sell shares `{ symbol, shares }` |

Indian equities use the `.BSE` suffix (e.g. `RELIANCE.BSE`); US tickers are used as-is
(e.g. `AAPL`).

## Running locally

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env
# Add a free Alpha Vantage API key to .env (optional — the app works without one,
# using demo data instead)
# Also set a JWT_SECRET (any long random string) — used to sign login tokens
npm start
```

Runs on `http://localhost:5000`.

**2. Frontend**

```bash
npm install
ng serve
```

Runs on `http://localhost:4200` and talks to the backend at `localhost:5000` (see
`src/environments/environment.ts`).

## Fallback data

Alpha Vantage's free tier allows only **25 requests/day**, which is easy to exhaust
during development or a live demo. Rather than let the app break once the quota is
hit, every backend route falls back to demo data. For the 12 curated stocks in
`backend/src/data/fallbackStocks.js`, this uses realistic hand-picked base prices.
For any *other* symbol (e.g. one surfaced by a live search that Alpha Vantage's
quota then can't quote), the fallback generates a stable synthetic price instead of
failing outright — same symbol always gets the same fallback price, computed from
a hash of the symbol string, not re-randomized on every request. Real API data is
always preferred when available; the API's own response body (not just HTTP status)
is checked for quota/error messages, since Alpha Vantage returns `HTTP 200` even
when the quota is exceeded.

## Known limitations

- Market index cards (NIFTY 50, SENSEX, etc.) on the dashboard are static sample
  values — Alpha Vantage's free tier doesn't provide Indian index data.
- Alpha Vantage's `SYMBOL_SEARCH` endpoint is US-market-biased; Indian BSE symbol
  search results can be inconsistent depending on the query.
- User accounts, watchlists, and portfolios are persisted to JSON files on disk
  (`backend/data/`), not a full database — fine for a portfolio project, not for
  production scale.
- Portfolio is a paper-trading simulation only — no real brokerage integration,
  no real money.
- Selling shares currently uses a browser `prompt()` for the quantity — functional
  but a placeholder for a proper modal/inline form.

## Tech stack

Angular 19 · TypeScript · RxJS · Chart.js · Node.js · Express · JWT · bcrypt · Alpha Vantage API
