// Minimal file-based persistence.
//
// StockScope doesn't run a separate database server — user accounts and
// watchlists are persisted as JSON files on disk. This keeps setup to
// "npm install && npm start" with no DB to provision, while still giving
// real persistence across server restarts (unlike the in-memory demo data
// used for stock quotes).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WATCHLISTS_FILE = path.join(DATA_DIR, 'watchlists.json');
const PORTFOLIOS_FILE = path.join(DATA_DIR, 'portfolios.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  if (!fs.existsSync(WATCHLISTS_FILE)) fs.writeFileSync(WATCHLISTS_FILE, '{}');
  if (!fs.existsSync(PORTFOLIOS_FILE)) fs.writeFileSync(PORTFOLIOS_FILE, '{}');
}

function readJson(file) {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  ensureDataFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Users ---

function getUsers() {
  return readJson(USERS_FILE);
}

function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return getUsers().find((u) => u.id === id);
}

function createUser(user) {
  const users = getUsers();
  users.push(user);
  writeJson(USERS_FILE, users);
  return user;
}

// --- Watchlists (keyed by user id) ---

function getWatchlist(userId) {
  const all = readJson(WATCHLISTS_FILE);
  return all[userId] || [];
}

function setWatchlist(userId, symbols) {
  const all = readJson(WATCHLISTS_FILE);
  all[userId] = symbols;
  writeJson(WATCHLISTS_FILE, all);
  return symbols;
}

// --- Portfolios (paper trading, keyed by user id) ---

const STARTING_CASH = 100000; // ₹1,00,000 virtual cash for new accounts

function getPortfolio(userId) {
  const all = readJson(PORTFOLIOS_FILE);
  if (!all[userId]) {
    all[userId] = { cash: STARTING_CASH, holdings: {}, transactions: [] };
    writeJson(PORTFOLIOS_FILE, all);
  }
  return all[userId];
}

function savePortfolio(userId, portfolio) {
  const all = readJson(PORTFOLIOS_FILE);
  all[userId] = portfolio;
  writeJson(PORTFOLIOS_FILE, all);
  return portfolio;
}

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
  getWatchlist,
  setWatchlist,
  getPortfolio,
  savePortfolio,
};
