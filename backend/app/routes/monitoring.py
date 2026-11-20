from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import FarmMonitoring, User
from app.schemas.schemas import MonitoringIn, MonitoringOut
from app.services.alerts import evaluate_reading
from app.services.simulator import read_sensors

router = APIRouter(prefix="/api/monitoring", tags=["Farm Monitoring"])


@router.post("", response_model=MonitoringOut, status_code=201)
def create_record(data: MonitoringIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = FarmMonitoring(user_id=user.id, source="simulated" if data.is_simulated else "manual", **data.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    evaluate_reading(db, user.id, user.profile, rec)
    return rec


@router.get("", response_model=list[MonitoringOut])
def list_records(limit: int = Query(100, ge=1, le=500), farm: str | None = None,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(FarmMonitoring).filter(FarmMonitoring.user_id == user.id)
    if farm:
        q = q.filter(FarmMonitoring.farm_name == farm)
    return q.order_by(FarmMonitoring.recorded_at.desc(), FarmMonitoring.id.desc()).limit(limit).all()


@router.get("/latest", response_model=MonitoringOut)
def latest(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = (db.query(FarmMonitoring).filter(FarmMonitoring.user_id == user.id)
           .order_by(FarmMonitoring.recorded_at.desc(), FarmMonitoring.id.desc()).first())
    if not rec:
        raise HTTPException(404, "No monitoring records yet")
    return rec


@router.get("/simulate")
def simulate(user: User = Depends(get_current_user)):
    """Return a SIMULATED sensor reading (not saved). Replace with real IoT ingestion later."""
    return read_sensors()


@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(FarmMonitoring).filter(FarmMonitoring.id == record_id, FarmMonitoring.user_id == user.id).first()
    if not rec:
        raise HTTPException(404, "Record not found")
    db.delete(rec)
    db.commit()
