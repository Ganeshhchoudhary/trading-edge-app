"""
routers/orders.py — Full order lifecycle via Zerodha Kite Connect
==================================================================
Endpoints:
  POST   /orders/place          Place a BUY/SELL order
  POST   /orders/place/bracket  Place a Bracket Order (BO) with SL+TP
  GET    /orders/status         Live order list from Kite (today)
  GET    /orders/history        Local persisted log (orders_log.json)
  DELETE /orders/cancel/{id}    Cancel a pending order
  GET    /orders/positions       Current open positions
  GET    /orders/holdings        Delivery holdings (CNC)
  GET    /orders/margins         Available margin breakdown
"""
import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.kite_client import get_kite
from backend.config import ORDERS_LOG

log = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["orders"])


# ── Helpers ────────────────────────────────────────────────────────────────────
def _load_log() -> list:
    try:
        return json.loads(ORDERS_LOG.read_text()) if ORDERS_LOG.exists() else []
    except Exception:
        return []


def _append_log(entry: dict):
    logs = _load_log()
    logs.append(entry)
    ORDERS_LOG.write_text(json.dumps(logs, indent=2))


def _kite_or_503():
    try:
        return get_kite()
    except RuntimeError as e:
        raise HTTPException(503, str(e))


# ── Request Models ─────────────────────────────────────────────────────────────
class OrderRequest(BaseModel):
    symbol:           str   = Field(...,      example="RELIANCE")
    transaction_type: str   = Field(...,      example="BUY")       # BUY | SELL
    quantity:         int   = Field(..., gt=0, example=1)
    order_type:       str   = Field("MARKET", example="MARKET")    # MARKET | LIMIT | SL | SL-M
    price:            float = Field(0.0,      example=0.0)         # Required for LIMIT
    trigger_price:    float = Field(0.0,      example=0.0)         # Required for SL / SL-M
    product:          str   = Field("MIS",    example="MIS")       # MIS | CNC | NRML
    exchange:         str   = Field("NSE",    example="NSE")       # NSE | BSE | MCX
    validity:         str   = Field("DAY",    example="DAY")       # DAY | IOC | TTL
    tag:              str   = Field("",       example="edge_ai")   # Optional order tag


class BracketOrderRequest(BaseModel):
    symbol:           str   = Field(...,      example="RELIANCE")
    transaction_type: str   = Field(...,      example="BUY")
    quantity:         int   = Field(..., gt=0, example=1)
    price:            float = Field(...,      example=2940.0)      # Entry limit price
    stop_loss:        float = Field(...,      example=2910.0)      # Absolute SL price
    take_profit:      float = Field(...,      example=2980.0)      # Absolute target price
    exchange:         str   = Field("NSE",    example="NSE")


# ── Place Regular Order ────────────────────────────────────────────────────────
@router.post("/place")
async def place_order(req: OrderRequest):
    """
    Place a BUY or SELL order on Zerodha Kite.

    - order_type MARKET → price ignored, executes at market
    - order_type LIMIT  → price required
    - order_type SL     → price + trigger_price required
    - product MIS       → Intraday (auto square-off at 3:20 PM)
    - product CNC       → Delivery (no square-off)
    """
    kite = _kite_or_503()
    symbol = req.symbol.upper().replace(".NS", "").strip()

    tx_type    = kite.TRANSACTION_TYPE_BUY if req.transaction_type.upper() == "BUY" else kite.TRANSACTION_TYPE_SELL
    exchange   = getattr(kite, f"EXCHANGE_{req.exchange.upper()}", kite.EXCHANGE_NSE)
    product    = getattr(kite, f"PRODUCT_{req.product.upper()}", kite.PRODUCT_MIS)
    order_type = {
        "MARKET": kite.ORDER_TYPE_MARKET,
        "LIMIT":  kite.ORDER_TYPE_LIMIT,
        "SL":     kite.ORDER_TYPE_SL,
        "SL-M":   kite.ORDER_TYPE_SLM,
    }.get(req.order_type.upper(), kite.ORDER_TYPE_MARKET)

    log_entry = {
        "timestamp":        datetime.now().isoformat(),
        "symbol":           symbol,
        "transaction_type": req.transaction_type.upper(),
        "quantity":         req.quantity,
        "order_type":       req.order_type.upper(),
        "price":            req.price,
        "trigger_price":    req.trigger_price,
        "product":          req.product.upper(),
        "exchange":         req.exchange.upper(),
        "tag":              req.tag or "web_ui",
        "status":           "PENDING",
        "order_id":         None,
        "error":            None,
    }

    try:
        params = dict(
            variety=kite.VARIETY_REGULAR,
            exchange=exchange,
            tradingsymbol=symbol,
            transaction_type=tx_type,
            quantity=req.quantity,
            product=product,
            order_type=order_type,
            validity=req.validity,
            tag=req.tag or "edge_ai_web",
        )
        if req.order_type.upper() == "LIMIT" and req.price > 0:
            params["price"] = req.price
        if req.order_type.upper() in ("SL", "SL-M") and req.trigger_price > 0:
            params["trigger_price"] = req.trigger_price
            if req.order_type.upper() == "SL":
                params["price"] = req.price

        log.info(f"📤 Placing {tx_type} {symbol} | Qty:{req.quantity} | {req.order_type} | {req.product}")
        order_id = kite.place_order(**params)

        log_entry.update({"status": "SUCCESS", "order_id": str(order_id)})
        _append_log(log_entry)
        log.info(f"✅ Order placed → ID: {order_id}")

        return {
            "status":           "success",
            "order_id":         str(order_id),
            "symbol":           symbol,
            "transaction_type": req.transaction_type.upper(),
            "quantity":         req.quantity,
            "order_type":       req.order_type.upper(),
            "product":          req.product.upper(),
            "message":          f"✅ {req.transaction_type.upper()} {req.quantity} {symbol} order placed!",
            "timestamp":        log_entry["timestamp"],
        }

    except Exception as e:
        err = str(e)
        log_entry.update({"status": "FAILED", "error": err})
        _append_log(log_entry)
        log.error(f"❌ Order failed [{symbol}]: {err}")
        raise HTTPException(400, {"status": "failed", "symbol": symbol, "error": err})


# ── Place Bracket Order ────────────────────────────────────────────────────────
@router.post("/place/bracket")
async def place_bracket_order(req: BracketOrderRequest):
    """
    Place a Bracket Order with automatic Stop-Loss and Take-Profit.
    Note: Kite VARIETY_BO expects point difference, not absolute price.
    """
    kite = _kite_or_503()
    symbol   = req.symbol.upper().replace(".NS", "").strip()
    tx_type  = kite.TRANSACTION_TYPE_BUY if req.transaction_type.upper() == "BUY" else kite.TRANSACTION_TYPE_SELL
    exchange = getattr(kite, f"EXCHANGE_{req.exchange.upper()}", kite.EXCHANGE_NSE)

    sl_points  = round(abs(req.price - req.stop_loss), 2)
    tp_points  = round(abs(req.take_profit - req.price), 2)

    log_entry = {
        "timestamp":        datetime.now().isoformat(),
        "symbol":           symbol,
        "transaction_type": req.transaction_type.upper(),
        "quantity":         req.quantity,
        "order_type":       "BO",
        "price":            req.price,
        "stop_loss":        req.stop_loss,
        "take_profit":      req.take_profit,
        "sl_points":        sl_points,
        "tp_points":        tp_points,
        "status":           "PENDING",
        "order_id":         None,
        "error":            None,
    }

    try:
        log.info(f"📤 Bracket Order: {symbol} {tx_type} | Entry:{req.price} | SL:{sl_points}pts | TP:{tp_points}pts")
        order_id = kite.place_order(
            variety=kite.VARIETY_BO,
            exchange=exchange,
            tradingsymbol=symbol,
            transaction_type=tx_type,
            quantity=req.quantity,
            product=kite.PRODUCT_MIS,
            order_type=kite.ORDER_TYPE_LIMIT,
            price=req.price,
            stoploss=sl_points,
            squareoff=tp_points,
            trailing_stoploss=0,
            tag="edge_ai_bo",
        )
        log_entry.update({"status": "SUCCESS", "order_id": str(order_id)})
        _append_log(log_entry)
        log.info(f"✅ Bracket Order placed → ID: {order_id}")
        return {
            "status":    "success",
            "order_id":  str(order_id),
            "symbol":    symbol,
            "sl_points": sl_points,
            "tp_points": tp_points,
            "message":   f"✅ Bracket Order placed for {symbol}",
        }
    except Exception as e:
        err = str(e)
        log_entry.update({"status": "FAILED", "error": err})
        _append_log(log_entry)
        log.error(f"❌ Bracket Order failed [{symbol}]: {err}")
        raise HTTPException(400, {"status": "failed", "symbol": symbol, "error": err})


# ── Order Status (Live from Kite) ──────────────────────────────────────────────
@router.get("/status")
async def order_status():
    """Fetch today's orders and trades directly from Kite."""
    kite = _kite_or_503()
    try:
        orders = kite.orders()
        trades = kite.trades()
        return {"status": "ok", "orders": orders, "trades": trades, "count": len(orders)}
    except Exception as e:
        raise HTTPException(400, str(e))


# ── Order History (Local Log) ──────────────────────────────────────────────────
@router.get("/history")
async def order_history():
    """Return local persisted order log (survives restarts, unlike Kite's intraday list)."""
    logs = _load_log()
    return {"status": "ok", "count": len(logs), "orders": list(reversed(logs))}


# ── Cancel Order ───────────────────────────────────────────────────────────────
@router.delete("/cancel/{order_id}")
async def cancel_order(order_id: str, variety: str = "regular"):
    """Cancel a pending order by order_id."""
    kite = _kite_or_503()
    try:
        v = getattr(kite, f"VARIETY_{variety.upper()}", kite.VARIETY_REGULAR)
        result = kite.cancel_order(variety=v, order_id=order_id)
        log.info(f"🗑️ Cancelled order {order_id}")
        return {"status": "cancelled", "order_id": order_id, "result": result}
    except Exception as e:
        raise HTTPException(400, str(e))


# ── Positions ──────────────────────────────────────────────────────────────────
@router.get("/positions")
async def positions():
    """Get current day + net open positions from Kite."""
    kite = _kite_or_503()
    try:
        pos = kite.positions()
        return {
            "status": "ok",
            "day":    pos.get("day", []),
            "net":    pos.get("net", []),
        }
    except Exception as e:
        raise HTTPException(400, str(e))


# ── Holdings ───────────────────────────────────────────────────────────────────
@router.get("/holdings")
async def holdings():
    """Get delivery (CNC) holdings."""
    kite = _kite_or_503()
    try:
        return {"status": "ok", "holdings": kite.holdings()}
    except Exception as e:
        raise HTTPException(400, str(e))


# ── Margins ────────────────────────────────────────────────────────────────────
@router.get("/margins")
async def margins():
    """Get available margin breakdown (equity + commodity)."""
    kite = _kite_or_503()
    try:
        return {"status": "ok", "margins": kite.margins()}
    except Exception as e:
        raise HTTPException(400, str(e))
