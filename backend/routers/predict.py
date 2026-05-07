'''predict.py — Prediction API Router
====================================
Provides an endpoint to get next‑day price prediction for a given NSE symbol.
'''\n\nimport logging\nfrom fastapi import APIRouter, HTTPException\n\nfrom backend.ml_model import predict_next_day\n\nrouter = APIRRouter(prefix="/predict", tags=["Prediction"])\n\nlog = logging.getLogger(__name__)\n\n@router.get("/{symbol}", summary="Predict next‑day price for a stock")\ndef get_prediction(symbol: str):\n    """Return price prediction and signal for *symbol*.
\n    The underlying model trains on the past 12 months of daily data (if not already trained)
    and caches predictions for one hour.
    """\n    try:\n        result = predict_next_day(symbol)\n    except Exception as e:\n        log.exception(f"Prediction failed for {symbol}")\n        raise HTTPException(status_code=500, detail=str(e))\n    return result\n
