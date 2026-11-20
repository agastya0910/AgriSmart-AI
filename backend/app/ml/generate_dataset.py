"""Generate a SYNTHETIC development dataset for crop recommendation.

IMPORTANT LIMITATIONS
- Samples are drawn from approximate per-crop value ranges (see crops_data.py), not from field trials.
- A model trained on this data will show very high accuracy because classes are generated from
  well-separated ranges. That accuracy is NOT evidence that it works on real farms.
- For real use, download the public 'Crop Recommendation Dataset' CSV (columns: N,P,K,temperature,
  humidity,ph,rainfall,label) and save it as backend/app/ml/data/Crop_recommendation.csv.
  train.py will automatically prefer that file.
"""
from pathlib import Path
import numpy as np
import pandas as pd
from app.ml.crops_data import CROPS, FEATURES

DATA_DIR = Path(__file__).resolve().parent / "data"
SYNTHETIC_CSV = DATA_DIR / "synthetic_crop_recommendation.csv"


def generate(samples_per_crop: int = 100, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for label, c in CROPS.items():
        cols = []
        for lo, hi in c["ranges"]:
            mid, sd = (lo + hi) / 2, (hi - lo) / 4 or 0.1
            cols.append(np.clip(rng.normal(mid, sd, samples_per_crop), lo, hi))
        block = pd.DataFrame(np.column_stack(cols), columns=FEATURES)
        block["label"] = label
        rows.append(block)
    df = pd.concat(rows, ignore_index=True).sample(frac=1, random_state=seed).reset_index(drop=True)
    return df.round(2)


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    generate().to_csv(SYNTHETIC_CSV, index=False)
    print(f"Wrote {SYNTHETIC_CSV}")
