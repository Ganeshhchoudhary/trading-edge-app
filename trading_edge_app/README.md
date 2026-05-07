# Trading at the Edge — Flutter App

On-device AI trading platform for NSE/BSE with Zerodha Kite integration.

---

## Setup (5 minutes)

### Step 1 — Copy project
```
trading_edge_app/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   ├── app_config.dart   ← SIRF YEH EDIT KARNI HAI
│   │   └── theme.dart
│   ├── models/models.dart
│   ├── services/
│   │   ├── kite_service.dart
│   │   ├── signal_engine.dart
│   │   └── app_state.dart
│   ├── widgets/
│   │   ├── common_widgets.dart
│   │   └── price_chart.dart
│   └── screens/
│       ├── dashboard_screen.dart
│       ├── signals_screen.dart
│       ├── portfolio_screen.dart
│       └── edge_monitor_screen.dart
└── pubspec.yaml
```

### Step 2 — Install dependencies
```bash
cd trading_edge_app
flutter pub get
```

### Step 3 — Run (mock data, no keys needed)
```bash
flutter run
```
App mock data se chalegi — sab screens working honge.

---

## Zerodha Kite API Enable Karna

### Step 1 — API Key lao
1. https://kite.trade/ → Login → My Apps → Create App
2. `api_key` copy karo

### Step 2 — Access Token generate karo (daily)
```
https://kite.trade/connect/login?api_key=YOUR_API_KEY&v=3
```
Login karo → redirect URL se `request_token` nikalo → Postman ya curl se:
```bash
curl -X POST https://api.kite.trade/session/token \
  -H "X-Kite-Version: 3" \
  -d "api_key=YOUR_KEY&request_token=YOUR_REQUEST_TOKEN&checksum=SHA256(api_key+request_token+api_secret)"
```
Response mein `access_token` aayega.

### Step 3 — app_config.dart update karo
```dart
static const String kiteApiKey = 'abc123xyz';        // apni key
static const String kiteAccessToken = 'def456uvw';   // apna token
static const bool useMockData = false;               // false karo
```

---

## Features

| Screen | Description |
|--------|-------------|
| Dashboard | Live prices, OHLCV chart, watchlist |
| Signals | AI buy/sell/hold signals with RSI+MACD+BB |
| Portfolio | Holdings, P&L, allocation pie chart |
| Edge AI Monitor | Inference latency, TFLite stats, service health |

## Architecture
- **Signal Engine**: RSI + MACD + Bollinger Bands + Volume → buy/sell/hold
- **Edge Inference**: On-device (no server needed), sub-100ms target
- **Mock Mode**: Full app works without API keys
- **Auto-refresh**: Every 5 seconds

## Tech Stack
- Flutter 3.x + Dart 3.x
- fl_chart (charts)
- provider (state)
- http (Kite API)
- google_fonts (Inter)
