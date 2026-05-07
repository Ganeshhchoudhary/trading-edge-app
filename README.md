# Trading at the Edge — AI-Powered Trading Platform

**Real-time trading dashboard with Edge AI inference, Zerodha Kite Connect integration, and CNN-LSTM price prediction.**

---

## 🚀 Features

- **Real-time Market Data** — Live LTP streaming via Kite WebSocket
- **Edge AI Signals** — On-device inference with sub-100ms latency (Flutter + TFLite)
- **CNN-LSTM Prediction** — Next-day price forecasting using 6 months of historical data
- **Order Execution** — Place BUY/SELL/Bracket orders directly via Kite Connect API
- **Portfolio Analytics** — Track P&L, holdings, and sector allocation
- **Multi-Platform** — Web dashboard + Flutter mobile app

---

## 📁 Project Structure

```
trading_edge_app/
├── backend/                    # FastAPI backend
│   ├── routers/
│   │   ├── auth.py            # Kite login & token management
│   │   ├── market.py          # Live data + WebSocket + ML predictions
│   │   └── orders.py          # Order placement & portfolio
│   ├── config.py              # API keys & instrument tokens
│   ├── kite_client.py         # Kite Connect singleton
│   ├── ml_model.py            # CNN-LSTM price prediction model
│   ├── main.py                # FastAPI app entry point
│   ├── .env                   # Environment variables (API keys)
│   └── requirements.txt       # Python dependencies
│
├── trading_edge_app/          # Flutter mobile app
│   └── lib/
│       ├── screens/           # Dashboard, Signals, Portfolio, Edge Monitor
│       ├── services/          # Kite API, Signal Engine (TFLite)
│       ├── models/            # Data models
│       └── config/            # App config & theme
│
├── index.html                 # Web dashboard (main)
├── insights.html              # AI insights & sentiment
├── engine.html                # Trading engine config
├── portfolio.html             # Portfolio management
├── settings.html              # Settings & API keys
├── api_client.js              # Backend API client
├── dashboard.js               # Dashboard logic
├── insights.js                # Insights page logic
├── engine.js                  # Engine page logic
├── portfolio.js               # Portfolio page logic
├── settings.js                # Settings page logic
├── data.js                    # Mock data & utilities
├── charts.js                  # Chart.js helpers
└── styles.css                 # Global styles
```

---

## ⚙️ Setup Instructions

### 1. Backend Setup (FastAPI)

#### Prerequisites
- Python 3.10+
- Zerodha Kite Connect API credentials

#### Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API keys:**
   Edit `backend/.env`:
   ```env
   API_KEY=your_kite_api_key_here
   API_SECRET=your_kite_api_secret_here
   ACCESS_TOKEN=your_access_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_KEY=change_this_to_a_random_64char_string
   PORT=8000
   ```

   **How to get Kite API keys:**
   - Go to https://kite.trade/
   - Navigate to **My Apps** → **Create App**
   - Copy `API_KEY` and `API_SECRET`
   - Generate `ACCESS_TOKEN` via login flow (see step 4)

4. **Start the backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Generate ACCESS_TOKEN:**
   - Open http://localhost:8000/auth/login
   - Login with your Zerodha credentials
   - Token will be auto-saved to `.env`

6. **Verify backend:**
   - Open http://localhost:8000/docs (Swagger UI)
   - Check http://localhost:8000/health

---

### 2. Web Dashboard Setup

#### Prerequisites
- Modern web browser (Chrome/Firefox/Edge)
- Backend running on `localhost:8000`

#### Steps

1. **Open the dashboard:**
   ```bash
   # From project root
   # Simply open index.html in your browser
   # Or use a local server:
   python -m http.server 3000
   ```

2. **Access pages:**
   - Dashboard: http://localhost:3000/index.html
   - AI Insights: http://localhost:3000/insights.html
   - Trading Engine: http://localhost:3000/engine.html
   - Portfolio: http://localhost:3000/portfolio.html
   - Settings: http://localhost:3000/settings.html

3. **Configure backend URL:**
   - Edit `api_client.js` if backend is not on `localhost:8000`:
     ```javascript
     const API_BASE = 'http://localhost:8000';
     ```

---

### 3. Flutter Mobile App Setup

#### Prerequisites
- Flutter SDK 3.0+
- Android Studio / Xcode
- Dart 3.0+

#### Steps

1. **Navigate to Flutter app:**
   ```bash
   cd trading_edge_app
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Configure API keys:**
   Edit `lib/config/app_config.dart`:
   ```dart
   static const String kiteApiKey = 'YOUR_API_KEY_HERE';
   static const String kiteAccessToken = 'YOUR_ACCESS_TOKEN_HERE';
   static const bool useMockData = false;  // Set to true for testing without API
   ```

4. **Run the app:**
   ```bash
   flutter run
   ```

5. **Build for release:**
   ```bash
   # Android
   flutter build apk --release

   # iOS
   flutter build ios --release
   ```

---

## 🔑 API Endpoints

### Authentication
- `GET /auth/login` — Redirect to Kite login
- `GET /auth/callback` — OAuth callback (auto-called by Kite)
- `POST /auth/token` — Manually set access token
- `GET /auth/profile` — Get user profile
- `GET /auth/status` — Check auth status

### Market Data
- `GET /market/ltp/all` — All cached LTPs
- `GET /market/ltp/{symbol}` — Single symbol LTP
- `GET /market/quote/{symbol}` — Full OHLCV quote
- `GET /market/search/{query}` — Search instruments
- `GET /market/predict/{symbol}` — CNN-LSTM price prediction
- `WS /market/stream` — WebSocket live price stream

### Orders
- `POST /orders/place` — Place regular order
- `POST /orders/place/bracket` — Place bracket order (SL+TP)
- `GET /orders/status` — Live order status
- `GET /orders/history` — Local order log
- `DELETE /orders/cancel/{id}` — Cancel order
- `GET /orders/positions` — Current positions
- `GET /orders/holdings` — Delivery holdings
- `GET /orders/margins` — Available margins

---

## 🤖 ML Model Details

### CNN-LSTM Architecture
- **Input:** Last 10 days of closing prices
- **Features:** Close price (normalized)
- **Layers:**
  - Conv1D (64 filters, kernel=3) + MaxPooling
  - LSTM (50 units)
  - Dropout (0.2)
  - Dense (25) → Dense (1)
- **Training:** 6 months of daily data from Yahoo Finance
- **Optimizer:** Adam
- **Loss:** MSE

### Prediction Endpoint
```python
GET /market/predict/RELIANCE

Response:
{
  "symbol": "RELIANCE",
  "current_price": 2941.50,
  "predicted_price": 2968.30,
  "predicted_change": +26.80,
  "predicted_change_pct": +0.91,
  "signal": "BULLISH",
  "model": "CNN-LSTM",
  "trained_on": "6 Months Daily",
  "timestamp": "2025-05-06T15:30:00"
}
```

---

## 📊 Dashboard Features

### 1. Market Dashboard (`index.html`)
- Live index cards (NIFTY 50, SENSEX, BANK NIFTY, VIX)
- Intraday chart with AI signal overlay
- Top movers (gainers/losers)
- Active positions with P&L
- Signal activity feed

### 2. AI Insights (`insights.html`)
- Market sentiment gauge (Fear & Greed Index)
- AI signal breakdowns (Edge AI + Gemini)
- Sentiment history chart
- News feed with sentiment scoring
- Mobile device sync (QR code)

### 3. Trading Engine (`engine.html`)
- Active strategy models (Trend Following, Mean Reversion, etc.)
- Risk parameters (capital, SL%, TP%, confidence threshold)
- Performance chart (30-day win rate)
- Watchlist management
- Execution log

### 4. Portfolio (`portfolio.html`)
- Portfolio summary (value, P&L, holdings)
- Sector allocation pie chart
- Holdings list with live P&L
- Trade history
- Order placement modal

### 5. Settings (`settings.html`)
- Profile management
- API credentials (Kite, Gemini, NSE Bridge)
- Notification preferences
- Display & system settings
- Service status monitor

---

## 🛠️ Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend Development
```bash
# Use any local server
python -m http.server 3000
# Or
npx serve .
```

### Flutter Development
```bash
cd trading_edge_app
flutter run
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ACCESS_TOKEN not set`
- **Solution:** Visit http://localhost:8000/auth/login and complete Kite login flow

**Problem:** `No data yet. Market may be closed`
- **Solution:** Kite WebSocket only works during market hours (9:15 AM - 3:30 PM IST)
- **Workaround:** Use mock data or test with historical data

**Problem:** `Module not found: tensorflow`
- **Solution:** `pip install tensorflow>=2.14.0`

### Frontend Issues

**Problem:** Backend offline banner
- **Solution:** Ensure backend is running on `localhost:8000`
- **Check:** http://localhost:8000/health

**Problem:** CORS errors
- **Solution:** Backend already has CORS enabled for `*`. Check browser console for details.

### Flutter Issues

**Problem:** `useMockData = false` but no data
- **Solution:** Set `useMockData = true` in `app_config.dart` for testing without API

**Problem:** Build errors
- **Solution:** Run `flutter clean && flutter pub get`

---

## 📝 License

MIT License — Free to use for personal and commercial projects.

---

## 🙏 Credits

- **Zerodha Kite Connect** — Market data & order execution
- **Google Gemini API** — AI-powered market analysis
- **TensorFlow** — CNN-LSTM price prediction
- **Chart.js** — Interactive charts
- **Flutter** — Cross-platform mobile app
- **FastAPI** — High-performance backend

---

## 📧 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API docs at http://localhost:8000/docs
3. Check backend logs for errors

---

**Built with ❤️ for traders who want to stay at the edge.**
