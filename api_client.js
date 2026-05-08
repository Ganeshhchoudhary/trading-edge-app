// ─── API CLIENT — connects frontend to the FastAPI backend ──────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;

/**
 * Place a regular order via the backend → Kite Connect
 * @param {object} params
 * @returns {Promise<object>} API response
 */
async function apiPlaceOrder(params) {
  const res = await fetch(`${API_BASE}/orders/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail?.error || data.detail || 'Order failed');
  return data;
}

/**
 * Place a bracket order (with stop-loss + take-profit)
 */
async function apiPlaceBracketOrder(params) {
  const res = await fetch(`${API_BASE}/orders/place/bracket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail?.error || data.detail || 'Bracket order failed');
  return data;
}

/** GET /orders/status — live orders from Kite */
async function apiFetchOrderStatus() {
  const res = await fetch(`${API_BASE}/orders/status`);
  if (!res.ok) throw new Error('Failed to fetch order status');
  return res.json();
}

/** GET /orders/history — local persisted log */
async function apiFetchOrderHistory() {
  const res = await fetch(`${API_BASE}/orders/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

/** DELETE /orders/cancel/{id} */
async function apiCancelOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/cancel/${orderId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Cancel failed');
  return res.json();
}

/** GET /orders/positions */
async function apiFetchPositions() {
  const res = await fetch(`${API_BASE}/orders/positions`);
  if (!res.ok) throw new Error('Failed to fetch positions');
  return res.json();
}

/** GET /orders/margins */
async function apiFetchMargins() {
  const res = await fetch(`${API_BASE}/orders/margins`);
  if (!res.ok) throw new Error('Failed to fetch margins');
  return res.json();
}

/** GET /market/ltp/all */
async function apiFetchAllLTP() {
  const res = await fetch(`${API_BASE}/market/ltp/all`);
  if (!res.ok) return null;
  return res.json();
}

/** GET /market/quote/{symbol} */
async function apiGetQuote(symbol, exchange = 'NSE') {
  const res = await fetch(`${API_BASE}/market/quote/${symbol}?exchange=${exchange}`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  return res.json();
}

/** GET /market/predict/{symbol} */
async function apiGetPrediction(symbol) {
  const res = await fetch(`${API_BASE}/market/predict/${symbol}`);
  if (!res.ok) throw new Error('Failed to fetch prediction');
  return res.json();
}

/** GET /auth/status */
async function apiCheckAuth() {
  try {
    const res = await fetch(`${API_BASE}/auth/status`);
    return res.json();
  } catch { return { status: 'offline' }; }
}

/** GET /health */
async function apiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  } catch { return { status: 'offline' }; }
}

// ─── BACKEND STATUS BANNER ────────────────────────────────────────────────────
async function checkBackendStatus() {
  const h = await apiHealth();
  const banner = document.getElementById('backend-banner');
  if (!banner) return;

  if (h.status === 'offline') {
    banner.innerHTML = `<span class="material-symbols-outlined text-[16px]">warning</span>
      Backend offline — Start: <code style="background:#282a2e;padding:2px 8px;border-radius:4px">cd backend && uvicorn main:app --reload</code>`;
    banner.className = 'backend-banner warn';
    banner.classList.remove('hidden');
  } else if (!h.credentials_set) {
    banner.innerHTML = `<span class="material-symbols-outlined text-[16px]">key</span>
      Kite not authenticated — <a href="http://localhost:8000/auth/login" target="_blank" style="color:#c1c1ff;text-decoration:underline">Click here to login</a>`;
    banner.className = 'backend-banner warn';
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

// Banner styles (injected once)
(function injectBannerStyle() {
  if (document.getElementById('banner-style')) return;
  const s = document.createElement('style');
  s.id = 'banner-style';
  s.textContent = `.backend-banner{display:flex;align-items:center;gap:8px;padding:10px 20px;font-size:13px;position:fixed;top:64px;left:0;right:0;z-index:49;justify-content:center;transition:all .3s}
  .backend-banner.warn{background:rgba(255,185,95,0.15);color:#ffb95f;border-bottom:1px solid rgba(255,185,95,0.3)}
  .backend-banner.hidden{display:none}`;
  document.head.appendChild(s);
})();

// Inject banner div into body
(function injectBannerDiv() {
  if (document.getElementById('backend-banner')) return;
  const d = document.createElement('div');
  d.id = 'backend-banner';
  d.className = 'backend-banner hidden';
  document.body.insertBefore(d, document.body.firstChild);
})();

// Check on load
document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  setInterval(checkBackendStatus, 30000); // re-check every 30s
});
