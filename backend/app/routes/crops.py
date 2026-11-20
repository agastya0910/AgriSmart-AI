from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.ml.crops_data import CROPS, FEATURES, slug
from app.models import User

router = APIRouter(prefix="/api/crops", tags=["Crop Information"])


def _public(key: str, c: dict) -> dict:
    return {"id": key, "name": c["name"], "soil": c["soil"], "temperature": c["temperature"], "water": c["water"],
            "season": c["season"], "info": c["info"],
            "typical_ranges": {f: {"min": lo, "max": hi} for f, (lo, hi) in zip(FEATURES, c["ranges"])}}


@router.get("")
def list_crops(search: str | None = None, season: str | None = None, user: User = Depends(get_current_user)):
    items = [_public(k, v) for k, v in CROPS.items()]
    if search:
        s = search.lower()
        items = [i for i in items if s in i["name"].lower() or s in i["info"].lower() or s in i["soil"].lower()]
    if season:
        items = [i for i in items if season.lower() in i["season"].lower()]
    return sorted(items, key=lambda i: i["name"])


@router.get("/{crop_name}")
def get_crop(crop_name: str, user: User = Depends(get_current_user)):
    key = slug(crop_name)
    if key not in CROPS:
        raise HTTPException(404, "Crop not found")
    return _public(key, CROPS[key])
