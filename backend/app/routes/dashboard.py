import json
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.ml.crops_data import CROPS
from app.models import CropRecommendation, FarmMonitoring, Notification, User

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    last = (db.query(FarmMonitoring).filter(FarmMonitoring.user_id == user.id)
            .order_by(FarmMonitoring.recorded_at.desc(), FarmMonitoring.id.desc()).limit(30).all())
    farms = {r.farm_name for r in db.query(FarmMonitoring.farm_name).filter(FarmMonitoring.user_id == user.id).distinct()}
    if user.profile and user.profile.farm_name:
        farms.add(user.profile.farm_name)
    avg = lambda vals: round(sum(vals) / len(vals), 1) if vals else None
    latest_rec = (db.query(CropRecommendation).filter(CropRecommendation.user_id == user.id)
                  .order_by(CropRecommendation.created_at.desc(), CropRecommendation.id.desc()).first())
    recs = (db.query(CropRecommendation).filter(CropRecommendation.user_id == user.id)
            .order_by(CropRecommendation.created_at.desc(), CropRecommendation.id.desc()).limit(5).all())
    alerts = (db.query(Notification).filter(Notification.user_id == user.id)
              .order_by(Notification.created_at.desc(), Notification.id.desc()).limit(5).all())
    activities = (
        [{"type": "monitoring", "text": f"Recorded readings for {r.farm_name}" + (" (simulated)" if r.is_simulated else ""),
          "at": r.recorded_at} for r in last[:5]]
        + [{"type": "recommendation", "text": f"Recommended {CROPS.get(r.predicted_crop, {}).get('name', r.predicted_crop)}",
            "at": r.created_at} for r in recs]
    )
    activities.sort(key=lambda a: a["at"], reverse=True)
    return {
        "total_farms": len(farms),
        "avg_soil_moisture": avg([r.soil_moisture for r in last]),
        "avg_temperature": avg([r.temperature for r in last]),
        "active_alerts": db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).count(),
        "latest_recommendation": None if not latest_rec else {
            "crop": CROPS.get(latest_rec.predicted_crop, {}).get("name", latest_rec.predicted_crop),
            "confidence": latest_rec.confidence, "created_at": latest_rec.created_at},
        "latest_recommendations": [{"id": r.id, "crop": CROPS.get(r.predicted_crop, {}).get("name", r.predicted_crop),
                                    "confidence": r.confidence, "created_at": r.created_at} for r in recs],
        "recent_alerts": [{"id": a.id, "title": a.title, "message": a.message, "severity": a.severity,
                           "is_read": a.is_read, "created_at": a.created_at} for a in alerts],
        "recent_activities": activities[:8],
        "monitoring_count": db.query(func.count(FarmMonitoring.id)).filter(FarmMonitoring.user_id == user.id).scalar(),
    }


@router.get("/charts")
def charts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(FarmMonitoring).filter(FarmMonitoring.user_id == user.id)
            .order_by(FarmMonitoring.recorded_at.desc(), FarmMonitoring.id.desc()).limit(20).all())[::-1]
    trends = [{"label": r.recorded_at.strftime("%d %b %H:%M"), "temperature": r.temperature, "humidity": r.humidity,
               "soil_moisture": r.soil_moisture, "rainfall": r.rainfall, "simulated": r.is_simulated} for r in rows]
    counts = Counter(c for (c,) in db.query(CropRecommendation.predicted_crop).filter(CropRecommendation.user_id == user.id))
    dist = [{"crop": CROPS.get(k, {}).get("name", k), "count": v} for k, v in counts.most_common()]
    return {"trends": trends, "crop_distribution": dist}
