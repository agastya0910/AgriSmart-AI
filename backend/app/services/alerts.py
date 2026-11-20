from datetime import timedelta
from sqlalchemy.orm import Session
from app.models import Notification, UserProfile, utcnow


def create_alert(db: Session, user_id: int, category: str, title: str, message: str, severity: str = "warning"):
    """Create a notification unless an identical unread one was created in the last hour."""
    since = utcnow() - timedelta(hours=1)
    dup = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.category == category,
                Notification.title == title, Notification.is_read.is_(False), Notification.created_at >= since)
        .first()
    )
    if dup:
        return None
    n = Notification(user_id=user_id, category=category, title=title, message=message, severity=severity)
    db.add(n)
    return n


def evaluate_reading(db: Session, user_id: int, profile: UserProfile, r) -> list:
    """Compare a monitoring reading with the user's configured thresholds."""
    created = []
    tag = " (simulated reading)" if r.is_simulated else ""
    if r.soil_moisture < profile.min_soil_moisture:
        created.append(create_alert(db, user_id, "moisture", "Low soil moisture",
            f"{r.farm_name}: soil moisture is {r.soil_moisture:.0f}%, below your minimum of {profile.min_soil_moisture:.0f}%.{tag}", "critical"))
    if r.temperature > profile.max_temperature:
        created.append(create_alert(db, user_id, "temperature", "High temperature",
            f"{r.farm_name}: temperature is {r.temperature:.1f} C, above your limit of {profile.max_temperature:.1f} C.{tag}", "warning"))
    if r.ph < profile.min_ph or r.ph > profile.max_ph:
        created.append(create_alert(db, user_id, "ph", "Soil pH out of range",
            f"{r.farm_name}: soil pH is {r.ph:.1f}, outside your range of {profile.min_ph:.1f}-{profile.max_ph:.1f}.{tag}", "warning"))
    db.commit()
    return [c for c in created if c]
