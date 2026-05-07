"""
routers/auth.py — Kite login flow & token generation
=====================================================
Flow:
  1. GET  /auth/login       → redirect user to Kite login URL
  2. GET  /auth/callback    → Kite redirects here with ?request_token=xxx
  3. POST /auth/token       → manually set a known access token
  4. GET  /auth/profile     → return Kite user profile
  5. GET  /auth/status      → check if credentials are valid
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from kiteconnect import KiteConnect

from backend.config import API_KEY, API_SECRET
from backend.kite_client import set_access_token, get_kite

log = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ── Request/Response models ────────────────────────────────────────────────────
class TokenRequest(BaseModel):
    access_token: str


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/login")
def login():
    """
    Step 1: Redirect the user to Zerodha's login page.
    After login, Kite redirects to /auth/callback?request_token=xxx
    """
    if not API_KEY:
        raise HTTPException(503, "API_KEY not set in backend/.env")
    kite = KiteConnect(api_key=API_KEY)
    url = kite.login_url()
    log.info(f"Redirecting to Kite login: {url}")
    return RedirectResponse(url)


@router.get("/callback")
def callback(request: Request):
    """
    Step 2: Kite sends `request_token` here after the user logs in.
    Exchange it for an access_token and save it.
    """
    request_token = request.query_params.get("request_token")
    if not request_token:
        raise HTTPException(400, "Missing request_token in callback URL")

    if not API_SECRET or API_SECRET == "your_api_secret_here":
        raise HTTPException(503, "API_SECRET not set in backend/.env")

    try:
        kite = KiteConnect(api_key=API_KEY)
        session = kite.generate_session(request_token, api_secret=API_SECRET)
        token = session["access_token"]
        set_access_token(token)
        log.info(f"✅ Login successful. Access token saved.")
        return HTMLResponse(content=f"""
        <!DOCTYPE html><html><head>
        <meta charset="utf-8"/>
        <style>body{{font-family:Inter,sans-serif;background:#111317;color:#e2e2e8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px}}.card{{background:#1e2024;border:1px solid #464555;border-radius:16px;padding:32px 40px;text-align:center}}.ok{{color:#4edea3;font-size:48px}}.token{{font-family:monospace;font-size:12px;color:#908fa0;word-break:break-all;max-width:400px}}</style>
        </head><body>
        <div class="card">
          <div class="ok">✅</div>
          <h2 style="color:#c1c1ff;margin:12px 0 4px">Login Successful</h2>
          <p style="color:#c7c4d7">Access token saved. You can close this tab.</p>
          <p class="token">Token: {token[:20]}…</p>
          <a href="/" style="color:#4edea3;font-size:13px">← Back to API</a>
        </div>
        </body></html>
        """, status_code=200)
    except Exception as e:
        log.error(f"Token exchange failed: {e}")
        raise HTTPException(400, f"Token exchange failed: {e}")


@router.post("/token")
def set_token(body: TokenRequest):
    """
    Manually set a known access_token (e.g. from generate_token.py).
    Use this if you already have a valid token from today's session.
    """
    set_access_token(body.access_token)
    return {"status": "ok", "message": "Access token set successfully."}


@router.get("/profile")
def profile():
    """Return the Kite user profile (confirms the token is valid)."""
    try:
        kite = get_kite()
        return kite.profile()
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/status")
def status():
    """Quick health-check: are credentials configured and valid?"""
    from backend.config import API_KEY, ACCESS_TOKEN
    configured = bool(API_KEY and ACCESS_TOKEN and ACCESS_TOKEN not in ("your_access_token_here", ""))
    try:
        if configured:
            kite = get_kite()
            kite.profile()
            return {"status": "authenticated", "api_key": API_KEY[:8] + "…"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
    return {"status": "not_configured", "hint": "Visit /auth/login to connect Kite."}
