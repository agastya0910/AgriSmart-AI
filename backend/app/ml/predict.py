import json
import threading

import joblib
import pandas as pd

from app.ml.crops_data import CROPS, FEATURES
from app.ml.train import META_PATH, MODEL_PATH, train

_model = None
_lock = threading.Lock()


def ensure_model():
    """Load the model; train it first if no saved model exists."""
    global _model
    with _lock:
        if _model is None:
            if not MODEL_PATH.exists():
                train()
            _model = joblib.load(MODEL_PATH)
    return _model


def model_info() -> dict:
    ensure_model()
    return json.loads(META_PATH.read_text())


def predict_crop(n, p, k, temperature, humidity, ph, rainfall, top_k: int = 3) -> dict:
    model = ensure_model()
    X = pd.DataFrame([[n, p, k, temperature, humidity, ph, rainfall]], columns=FEATURES)
    proba = model.predict_proba(X)[0]
    order = proba.argsort()[::-1][:top_k]
    top = [
        {"crop": model.classes_[i], "name": CROPS[model.classes_[i]]["name"], "probability": round(float(proba[i]), 4)}
        for i in order
    ]
    return {"crop": top[0]["crop"], "name": top[0]["name"], "confidence": top[0]["probability"], "top_predictions": top}
