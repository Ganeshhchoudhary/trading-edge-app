"""
main.py — FastAPI application entry point
=========================================
Start: uvicorn main:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from backend.routers.auth   import router as auth_router
from backend.routers.orders import router as orders_router
from backend.routers.market import router as market_router, start_ticker, stop_ticker
from backend.routers.predict import router as predict_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 Trading Edge Backend starting…")
    start_ticker()          # Kite WebSocket (non-blocking, daemon thread)
    yield
    stop_ticker()
    log.info("🛑 Backend stopped.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Trading at the Edge — Backend API",
    description="Zerodha Kite Connect order execution + real-time market data",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow the web frontend (index.html) from any origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(market_router)
app.include_router(predict_router)


# ── Root ───────────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def root():
    return """<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>Trading Edge API</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Inter,sans-serif;background:#111317;color:#e2e2e8;padding:40px;min-height:100vh}
  h1{color:#c1c1ff;font-size:28px;margin-bottom:8px}
  p{color:#908fa0;font-size:14px;margin-bottom:32px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
  .card{background:#1e2024;border:1px solid #464555;border-radius:12px;padding:20px}
  .card h3{color:#c1c1ff;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .ep{display:flex;flex-direction:column;gap:6px}
  .ep a{font-family:monospace;font-size:12px;color:#4edea3;text-decoration:none;padding:4px 8px;background:rgba(78,222,163,0.08);border-radius:6px;border:1px solid rgba(78,222,163,0.2)}
  .ep a:hover{background:rgba(78,222,163,0.18)}
  .badge{font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:50px}
  .ok{background:rgba(78,222,163,0.15);color:#4edea3;border:1px solid rgba(78,222,163,0.3)}
  .warn{background:rgba(255,185,95,0.15);color:#ffb95f;border:1px solid rgba(255,185,95,0.3)}
  footer{margin-top:32px;color:#464555;font-size:12px}
</style></head><body>
<h1>⚡ Trading at the Edge — API</h1>
<p>Zerodha Kite Connect · Edge AI Backend · v2.0</p>
<div class="grid">
  <div class="card">
    <h3>🔐 Authentication <span class="badge warn">SETUP FIRST</span></h3>
    <div class="ep">
      <a href="/auth/login">GET /auth/login → Kite Login</a>
      <a href="/auth/status">GET /auth/status → Check token</a>
      <a href="/auth/profile">GET /auth/profile → User info</a>
    </div>
  </div>
  <div class="card">
    <h3>📋 Orders <span class="badge ok">CORE</span></h3>
    <div class="ep">
      <a href="/docs#/orders/place_order_orders_place_post">POST /orders/place</a>
      <a href="/docs#/orders/place_bracket_order_orders_place_bracket_post">POST /orders/place/bracket</a>
      <a href="/orders/status">GET /orders/status</a>
      <a href="/orders/history">GET /orders/history</a>
      <a href="/orders/positions">GET /orders/positions</a>
      <a href="/orders/holdings">GET /orders/holdings</a>
      <a href="/orders/margins">GET /orders/margins</a>
    </div>
  </div>
  <div class="card">
    <h3>📈 Market Data <span class="badge ok">LIVE</span></h3>
    <div class="ep">
      <a href="/market/ltp/all">GET /market/ltp/all</a>
      <a href="/market/ltp/RELIANCE">GET /market/ltp/{symbol}</a>
      <a href="/market/quote/RELIANCE">GET /market/quote/{symbol}</a>
      <a href="/market/search/HDFC">GET /market/search/{query}</a>
      <a href="/docs">WS /market/stream</a>
    </div>
  </div>
  <div class="card">
    <h3>📚 API Docs</h3>
    <div class="ep">
      <a href="/docs">Swagger UI → /docs</a>
      <a href="/redoc">ReDoc → /redoc</a>
      <a href="/health">GET /health</a>
    </div>
  </div>
</div>
<footer>Running on http://localhost:8000 · CORS: * (web frontend allowed)</footer>
</body></html>"""


@app.get("/health")
def health():
    from backend.routers.market import price_cache, _ticker_running
    from backend.config import API_KEY, ACCESS_TOKEN
    return {
        "status":           "ok",
        "ticker_running":   _ticker_running,
        "symbols_cached":   len(price_cache),
        "credentials_set":  bool(API_KEY and ACCESS_TOKEN and ACCESS_TOKEN != "your_access_token_here"),
        "version":          "2.0.0",
    }
