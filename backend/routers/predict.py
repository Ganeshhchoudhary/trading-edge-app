"""predict.py — Prediction API Router
====================================
Provides an endpoint to get next-day price prediction for a given NSE symbol.
"""

import logging
from fastapi import APIRouter, HTTPException

from backend.ml_model import predict_next_day

router = APIRouter(prefix="/predict", tags=["Prediction"])

log = logging.getLogger(__name__)

@router.get("/{symbol}", summary="Predict next-day price for a stock")
def get_prediction(symbol: str):
    """Return price prediction and signal for *symbol*.
    The underlying model trains on the past 12 months of daily data (if not already trained)
    and caches predictions for one hour.
    """
    try:
        result = predict_next_day(symbol)
    except Exception as e:
        log.exception(f"Prediction failed for {symbol}")
        raise HTTPException(status_code=500, detail=str(e))
    return result
