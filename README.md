# 📈 StockScope

<p align="center">
  <strong>A Full-Stack Stock Market Analysis & Paper-Trading Platform</strong>
</p>

<p align="center">
  🔍 Search · 📊 Analyze · ⭐ Track · 🔄 Compare · 💰 Practice
</p>

<p align="center">

![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-purple?style=for-the-badge)

</p>

---

## 🌟 Overview

**StockScope** is a full-stack stock market analysis platform built to make exploring, tracking, comparing, and practicing stock trading simple and interactive.

Users can search for stocks, view market movements, analyze historical prices, create personalized watchlists, compare multiple stocks, and practice buying and selling through a **paper-trading portfolio with ₹1,00,000 in virtual cash**.

The application uses **Angular 19** for the frontend and **Node.js + Express** for the backend, with **Alpha Vantage** providing market data.

> 💡 **No real money is involved.** The portfolio feature is a simulation designed for learning, experimentation, and demonstration.

---

## 🧭 Quick Navigation

- [✨ Features](#-features)
- [📸 Application Gallery](#-application-gallery)
- [🏗️ Architecture](#️-architecture)
- [🛡️ Smart Fallback System](#️-smart-fallback-system)
- [💰 Paper Trading](#-paper-trading)
- [🔐 Authentication & Security](#-authentication--security)
- [🔌 API Endpoints](#-api-endpoints)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Running Locally](#-running-locally)
- [⚠️ Known Limitations](#️-known-limitations)
- [🚧 Future Improvements](#-future-improvements)

---

# ✨ Features

### 🔍 Smart Stock Search

- Search stocks by company name or symbol
- Debounced search results while typing
- Supports Indian BSE equities and major US tickers

**Examples:**

```text
RELIANCE.BSE
TCS.BSE
AAPL
MSFT
