"""
ml_model.py — CNN-LSTM Model for Stock Price Prediction
=======================================================
Trains on the last 6 months of daily data using yfinance.
Combines 1D CNN for feature extraction and LSTM for sequence modeling.
"""
import os
import numpy as np
import pandas as pd
import yfinance as yf
import logging
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from pathlib import Path
import threading

# Global lock to prevent concurrent TensorFlow trainings
_training_lock = threading.Lock()

log = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "saved_models"
MODELS_DIR.mkdir(exist_ok=True)

MODELS_DIR = Path(__file__).parent / "saved_models"
MODELS_DIR.mkdir(exist_ok=True)

# We will cache the scalers in memory for simplicity
_scalers = {}
_predictions_cache = {}

SEQ_LEN = 10  # Use last 10 days to predict next day

def get_historical_data(symbol: str, months: int = 12):
    """Fetch daily data from Yahoo Finance for the past N months (default 12)."""
    """Fetch daily data from Yahoo Finance for the past N months."""
    # Add .NS for NSE stocks
    yf_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)
    
    log.info(f"Fetching data for {yf_symbol} from {start_date.date()} to {end_date.date()}")
    df = yf.download(yf_symbol, start=start_date, end=end_date, progress=False)
    
    if df.empty:
        raise ValueError(f"No data found for {yf_symbol}")
    
    # We will just use the 'Close' price for the basic model
    # Can be extended to use OHLCV
    data = df[['Close']].copy()
    data.dropna(inplace=True)
    return data

def prepare_data(data: pd.DataFrame, symbol: str):
    """Scale data and create sequences."""
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    _scalers[symbol] = scaler
    
    X, y = [], []
    for i in range(SEQ_LEN, len(scaled_data)):
        X.append(scaled_data[i-SEQ_LEN:i, 0])
        y.append(scaled_data[i, 0])
        
    X, y = np.array(X), np.array(y)
    # Reshape X to [samples, time steps, features]
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    return X, y, scaled_data

def build_cnn_lstm_model(input_shape):
    """Build and compile the CNN-LSTM architecture."""
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, LSTM, Conv1D, MaxPooling1D, Dropout
    
    model = Sequential([
        # CNN layer for spatial/feature extraction
        Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape),
        MaxPooling1D(pool_size=2),
        
        # LSTM layer for temporal sequence modeling
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        
        # Fully connected output
        Dense(25, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def train_or_load_model(symbol: str, months: int = 12, force_retrain: bool = False):
    """Train the model or load it if already trained for today, using specified months of data."""
    model_path = MODELS_DIR / f"{symbol}_cnn_lstm.keras"
    
    # Simple caching: retrain if force_retrain or model doesn't exist
    if not force_retrain and model_path.exists():
        try:
            from tensorflow.keras.models import load_model
            model = load_model(model_path)
            # Ensure scaler is loaded; if not, fit quickly using recent data
            if symbol not in _scalers:
                data = get_historical_data(symbol, months)
                prepare_data(data, symbol)
            return model
        except Exception as e:
            log.warning(f"Failed to load model for {symbol}, retraining... Error: {e}")
    
    with _training_lock:
        # Check again inside lock to avoid duplicate training if another thread just finished it
        if not force_retrain and model_path.exists():
            try:
                from tensorflow.keras.models import load_model
                return load_model(model_path)
            except:
                pass
                
        log.info(f"Training CNN-LSTM model for {symbol} with {months} months of data...")
        data = get_historical_data(symbol, months)
        X, y, _ = prepare_data(data, symbol)
        
        if len(X) == 0:
            raise ValueError("Not enough data to train.")
        
        model = build_cnn_lstm_model((X.shape[1], 1))
        model.fit(X, y, batch_size=16, epochs=5, verbose=0)
        
        model.save(model_path)
        log.info(f"Model saved to {model_path}")
        return model

def predict_next_day(symbol: str) -> dict:
    """Predict the next day's closing price for the given symbol."""
    # Check cache first
    if symbol in _predictions_cache:
        cache_time, pred_data = _predictions_cache[symbol]
        # Return cached if less than 1 hour old
        if datetime.now() - cache_time < timedelta(hours=1):
            return pred_data
            
    model = train_or_load_model(symbol)
    
    # Get the latest data
    data = get_historical_data(symbol)
    if len(data) < SEQ_LEN:
        raise ValueError(f"Not enough data for {symbol} to predict.")
        
    scaler = _scalers[symbol]
    
    # Prepare the last SEQ_LEN days
    last_seq = data[-SEQ_LEN:].values
    last_seq_scaled = scaler.transform(last_seq)
    
    X_test = np.array([last_seq_scaled])
    X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))
    
    # Predict
    pred_scaled = model.predict(X_test, verbose=0)
    pred_price = scaler.inverse_transform(pred_scaled)[0][0]
    
    current_price = data['Close'].iloc[-1]
    # For a multi-index dataframe from yfinance, iloc[-1] might be a series. Get the float.
    if isinstance(current_price, pd.Series):
        current_price = current_price.iloc[0]
        
    change = pred_price - current_price
    change_pct = (change / current_price) * 100
    
    signal = "BULLISH" if change > 0 else "BEARISH"
    if abs(change_pct) < 0.2:
        signal = "NEUTRAL"
        
    result = {
        "symbol": symbol,
        "current_price": float(current_price),
        "predicted_price": float(pred_price),
        "predicted_change": float(change),
        "predicted_change_pct": float(change_pct),
        "signal": signal,
        "model": "CNN-LSTM",
        "trained_on": "6 Months Daily",
        "timestamp": datetime.now().isoformat()
    }
    
    _predictions_cache[symbol] = (datetime.now(), result)
    return result
