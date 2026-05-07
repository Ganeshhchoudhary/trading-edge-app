"""
kite_client.py — Singleton KiteConnect instance + token management
"""
import logging
from kiteconnect import KiteConnect, KiteTicker
from backend.config import API_KEY, ACCESS_TOKEN

log = logging.getLogger(__name__)

_kite: KiteConnect | None = None


def get_kite() -> KiteConnect:
    """
    Return a cached, authenticated KiteConnect instance.
    Raises RuntimeError if credentials are not configured.
    """
    global _kite
    if _kite is None:
        if not API_KEY:
            raise RuntimeError("API_KEY not set in backend/.env")
        _kite = KiteConnect(api_key=API_KEY)

    if ACCESS_TOKEN and ACCESS_TOKEN not in ("your_access_token_here", ""):
        _kite.set_access_token(ACCESS_TOKEN)
    else:
        raise RuntimeError(
            "ACCESS_TOKEN not set. Open http://localhost:8000/auth/login "
            "to generate a fresh token."
        )
    return _kite


def get_ticker() -> KiteTicker:
    """Return a KiteTicker using the stored credentials."""
    if not API_KEY or not ACCESS_TOKEN or ACCESS_TOKEN == "your_access_token_here":
        raise RuntimeError("Kite credentials not configured.")
    return KiteTicker(API_KEY, ACCESS_TOKEN)


def set_access_token(token: str):
    """Persist a new access token into the in-memory client."""
    global _kite
    import os
    from pathlib import Path

    # Write to .env so it survives restarts
    env_path = Path(__file__).parent / ".env"
    lines = env_path.read_text().splitlines()
    new_lines = []
    for line in lines:
        if line.startswith("ACCESS_TOKEN="):
            new_lines.append(f"ACCESS_TOKEN={token}")
        else:
            new_lines.append(line)
    env_path.write_text("\n".join(new_lines) + "\n")

    # Update the in-memory instance
    if _kite is None:
        _kite = KiteConnect(api_key=API_KEY)
    _kite.set_access_token(token)

    # Reload config
    os.environ["ACCESS_TOKEN"] = token
    log.info(f"✅ Access token updated and saved to .env")
