"""
routers/market.py — Live market data via Kite WebSocket + REST
==============================================================
Endpoints:
  GET /market/ltp/{symbol}     Single stock LTP (from memory cache)
  GET /market/ltp/all          All cached LTPs
  GET /market/quote/{symbol}   Full quote (OHLCV, depth)
  GET /market/search/{query}   Search instruments
  WS  /market/stream           WebSocket → streams price updates every 250ms
"""
import time
import asyncio
import logging
from threading import Thread

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from kiteconnect import KiteTicker

from backend.config import API_KEY, ACCESS_TOKEN, INSTRUMENT_TOKENS
from backend.kite_client import get_kite
from backend.ml_model import predict_next_day

log = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["market"])

# ── In-memory price cache ──────────────────────────────────────────────────────
price_cache: dict[int, dict] = {}
_ticker: KiteTicker | None = None
_ticker_running = False


# ── KiteTicker handlers ────────────────────────────────────────────────────────
def _on_ticks(ws, ticks: list):
    for tick in ticks:
        token = tick["instrument_token"]
        price_cache[token] = {
            "symbol":     INSTRUMENT_TOKENS.get(token, str(token)),
            "ltp":        tick.get("last_price", 0),
            "change":     round(tick.get("change", 0), 2),
            "volume":     tick.get("volume", 0),
            "ohlc":       tick.get("ohlc", {}),
            "timestamp":  str(tick.get("exchange_timestamp", "")),
            "fetched_at": time.time(),
        }


def _on_connect(ws, response):
    tokens = list(INSTRUMENT_TOKENS.keys())
    ws.subscribe(tokens)
    ws.set_mode(ws.MODE_LTP, tokens)
    log.info(f"✅ Kite WebSocket connected — {len(tokens)} instruments subscribed")


def _on_error(ws, code, reason):
    log.error(f"❌ Kite WebSocket error {code}: {reason}")


def _on_close(ws, code, reason):
    log.warning(f"⚠️ Kite WebSocket closed {code}: {reason}")


def start_ticker():
    """Start the Kite WebSocket ticker in a daemon thread."""
    global _ticker, _ticker_running
    if _ticker_running:
        return
    if not API_KEY or not ACCESS_TOKEN or ACCESS_TOKEN == "your_access_token_here":
        log.warning("⚠️ Kite credentials not set — ticker NOT started. Configure .env and restart.")
        return
    try:
        _ticker = KiteTicker(API_KEY, ACCESS_TOKEN)
        _ticker.on_ticks    = _on_ticks
        _ticker.on_connect  = _on_connect
        _ticker.on_error    = _on_error
        _ticker.on_close    = _on_close
        _ticker.connect(threaded=True)
        _ticker_running = True
        log.info("📡 Kite Ticker started in background thread")
    except Exception as e:
        log.error(f"❌ Failed to start Kite Ticker: {e}")


def stop_ticker():
    global _ticker, _ticker_running
    if _ticker:
        try:
            _ticker.close()
        except Exception:
            pass
    _ticker_running = False


# ── REST Endpoints ─────────────────────────────────────────────────────────────
@router.get("/ltp/all")
def get_all_ltp():
    """All cached LTPs from the WebSocket stream."""
    if not price_cache:
        raise HTTPException(503, "No data yet. Market may be closed or Kite credentials not set.")
    result = {}
    for token, d in price_cache.items():
        latency = round((time.time() - d["fetched_at"]) * 1000, 1)
        result[d["symbol"]] = {
            "ltp":        d["ltp"],
            "change":     d["change"],
            "volume":     d["volume"],
            "latency_ms": latency,
        }
    return {"status": "ok", "data": result, "count": len(result), "ts": time.time()}


@router.get("/ltp/{symbol}")
def get_ltp(symbol: str):
    """Single symbol LTP from memory cache."""
    sym = symbol.upper()
    token = next((t for t, s in INSTRUMENT_TOKENS.items() if s == sym), None)
    if token is None:
        raise HTTPException(404, f"Symbol '{sym}' not in INSTRUMENT_TOKENS. Add it to config.py.")
    d = price_cache.get(token)
    if d is None:
        raise HTTPException(503, "Data not yet received. Wait a few seconds after market open.")
    latency = round((time.time() - d["fetched_at"]) * 1000, 1)
    return {**d, "latency_ms": latency}


@router.get("/quote/{symbol}")
def get_quote(symbol: str, exchange: str = "NSE"):
    """Full OHLCV + market depth quote via REST (slower than LTP cache)."""
    try:
        kite = get_kite()
        key = f"{exchange.upper()}:{symbol.upper()}"
        data = kite.quote([key])
        return {"status": "ok", "symbol": symbol.upper(), "quote": data.get(key, {})}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/search/{query}")
def search_instruments(query: str, exchange: str = "NSE"):
    """Search for instruments matching a keyword."""
    try:
        kite = get_kite()
        results = kite.instruments(exchange=exchange.upper())
        q = query.upper()
        matches = [
            {"symbol": r["tradingsymbol"], "name": r["name"],
             "token": r["instrument_token"], "lot_size": r["lot_size"]}
            for r in results
            if q in r["tradingsymbol"].upper() or q in r.get("name", "").upper()
        ][:20]
        return {"status": "ok", "count": len(matches), "results": matches}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(400, str(e))


# ── Prediction Endpoint ───────────────────────────────────────────────────────
@router.get("/predict/{symbol}")
def get_prediction(symbol: str):
    """Predict the next day's closing price for a given symbol."""
    try:
        prediction = predict_next_day(symbol)
        return prediction
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        log.error(f"Prediction error for {symbol}: {e}")
        raise HTTPException(500, "Internal server error")


# ── WebSocket Stream ───────────────────────────────────────────────────────────
@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Real-time price stream. Connect via:
      ws://localhost:8000/market/stream
    Pushes JSON price snapshot every 250ms.
    """
    await websocket.accept()
    log.info("📱 WS client connected to /market/stream")
    try:
        while True:
            if price_cache:
                snapshot = {}
                for token, d in price_cache.items():
                    snapshot[d["symbol"]] = {
                        "ltp":    d["ltp"],
                        "change": d["change"],
                        "volume": d["volume"],
                    }
                await websocket.send_json(snapshot)
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        log.info("📱 WS client disconnected from /market/stream")
    except Exception as e:
        log.error(f"WS error: {e}")
