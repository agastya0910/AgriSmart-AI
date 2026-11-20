"""Train the Random Forest crop recommendation model.

Run from the backend folder:   python -m app.ml.train
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score, train_test_split

from app.ml.crops_data import FEATURES
from app.ml.generate_dataset import DATA_DIR, SYNTHETIC_CSV, generate

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_PATH = MODEL_DIR / "crop_model.joblib"
META_PATH = MODEL_DIR / "model_meta.json"
REAL_CSV = DATA_DIR / "Crop_recommendation.csv"


def load_dataset():
    if REAL_CSV.exists():
        df = pd.read_csv(REAL_CSV)
        df = df.rename(columns={"temperature": "temperature"})
        missing = set(FEATURES + ["label"]) - set(df.columns)
        if missing:
            raise ValueError(f"{REAL_CSV.name} is missing columns: {missing}")
        return df[FEATURES + ["label"]].dropna(), "real", REAL_CSV.name
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = generate()
    df.to_csv(SYNTHETIC_CSV, index=False)
    return df, "synthetic", SYNTHETIC_CSV.name


def train() -> dict:
    df, kind, name = load_dataset()
    X, y = df[FEATURES], df["label"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_tr, y_tr)
    acc = float(accuracy_score(y_te, model.predict(X_te)))
    cv = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1), X, y, cv=5)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    meta = {
        "algorithm": "RandomForestClassifier",
        "dataset_kind": kind,
        "dataset_file": name,
        "rows": int(len(df)),
        "classes": sorted(model.classes_.tolist()),
        "features": FEATURES,
        "holdout_accuracy": round(acc, 4),
        "cv_accuracy_mean": round(float(cv.mean()), 4),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "Trained on SYNTHETIC data generated from approximate crop ranges; metrics do not reflect real-world "
            "performance. Not validated for real agricultural decisions - consult a local agronomist."
            if kind == "synthetic"
            else "Trained on a public crop recommendation dataset. Not validated for your specific farm or region - "
                 "treat results as decision support and consult a local agronomist."
        ),
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    print(classification_report(y_te, model.predict(X_te), zero_division=0))
    print(f"Dataset: {kind} ({name}), rows={len(df)}  holdout accuracy={acc:.3f}  5-fold CV={cv.mean():.3f}")
    print(f"Saved model to {MODEL_PATH}")
    return meta


if __name__ == "__main__":
    train()
