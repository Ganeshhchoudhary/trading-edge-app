"""
config.py — Central configuration loaded from .env
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

API_KEY      = os.getenv("API_KEY", "")
API_SECRET   = os.getenv("API_SECRET", "")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SECRET_KEY   = os.getenv("SECRET_KEY", "change-me")
PORT         = int(os.getenv("PORT", 8000))

# Kite instrument tokens → symbol name
# Add more from: kite.instruments("NSE")
INSTRUMENT_TOKENS = {
    738561:  "RELIANCE",
    408065:  "TCS",
    341249:  "INFY",
    348929:  "WIPRO",
    340481:  "HDFCBANK",
    1270529: "ICICIBANK",
    492033:  "AXISBANK",
    779521:  "KOTAKBANK",
    2815745: "SBIN",
    895745:  "ONGC",
    134657:  "BPCL",
    1723649: "HINDUNILVR",
    315393:  "LT",
    2939649: "BHARTIARTL",
    3861249: "ADANIENT",
    260105:  "NIFTY 50",
    260617:  "NIFTY BANK",
}

LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
ORDERS_LOG = LOG_DIR / "orders_log.json"
