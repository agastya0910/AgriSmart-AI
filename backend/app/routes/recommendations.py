import json
from datetime import date, datetime, time as dtime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.ml.crops_data import CROPS
from app.ml.predict import model_info, predict_crop
from app.models import CropRecommendation, User
from app.schemas.schemas import RecommendIn

router = APIRouter(prefix="/api/recommendations", tags=["Crop Recommendation"])


def _serialize(r: CropRecommendation) -> dict:
    info = CROPS.get(r.predicted_crop, {})
    return {
        "id": r.id, "created_at": r.created_at,
        "inputs": {"nitrogen": r.nitrogen, "phosphorus": r.phosphorus, "potassium": r.potassium,
                   "temperature": r.temperature, "humidity": r.humidity, "ph": r.ph, "rainfall": r.rainfall},
        "predicted_crop": r.predicted_crop, "crop_name": info.get("name", r.predicted_crop),
        "confidence": r.confidence, "top_predictions": json.loads(r.top_predictions or "[]"),
    }


@router.post("/predict", status_code=201)
def predict(data: RecommendIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    res = predict_crop(data.nitrogen, data.phosphorus, data.potassium, data.temperature,
                       data.humidity, data.ph, data.rainfall)
    rec = CropRecommendation(user_id=user.id, **data.model_dump(), predicted_crop=res["crop"],
                             confidence=res["confidence"], top_predictions=json.dumps(res["top_predictions"]))
    db.add(rec)
    db.commit()
    db.refresh(rec)
    out = _serialize(rec)
    c = CROPS[res["crop"]]
    out["crop_info"] = {k: c[k] for k in ("name", "soil", "temperature", "water", "season", "info")}
    meta = model_info()
    out["model"] = {"dataset_kind": meta["dataset_kind"], "disclaimer": meta["disclaimer"]}
    out["note"] = "Confidence is the Random Forest's share of tree votes; it is not a calibrated probability of success."
    return out


@router.get("/model-info")
def info(user: User = Depends(get_current_user)):
    return model_info()


@router.get("/history")
def history(search: str | None = None, date_from: date | None = None, date_to: date | None = None,
            limit: int = Query(200, ge=1, le=1000),
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(CropRecommendation).filter(CropRecommendation.user_id == user.id)
    if search:
        s = search.strip().lower().replace(" ", "")
        q = q.filter(CropRecommendation.predicted_crop.like(f"%{s}%"))
    if date_from:
        q = q.filter(CropRecommendation.created_at >= datetime.combine(date_from, dtime.min))
    if date_to:
        q = q.filter(CropRecommendation.created_at < datetime.combine(date_to + timedelta(days=1), dtime.min))
    return [_serialize(r) for r in q.order_by(CropRecommendation.created_at.desc()).limit(limit).all()]


@router.delete("/{rec_id}", status_code=204)
def delete(rec_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(CropRecommendation).filter(CropRecommendation.id == rec_id, CropRecommendation.user_id == user.id).first()
    if not rec:
        raise HTTPException(404, "Record not found")
    db.delete(rec)
    db.commit()
