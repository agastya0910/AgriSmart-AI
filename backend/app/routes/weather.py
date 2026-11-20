from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services.alerts import create_alert
from app.services.weather import get_weather

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("")
def weather(location: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loc = (location or (user.profile.location if user.profile else None) or "").strip() or None
    data = get_weather(loc)
    # Weather-driven alerts (only for real weather data, so simulated values never trigger real-looking alerts)
    if not data["is_simulated"]:
        p = user.profile
        if p and data["current"]["temperature"] > p.max_temperature:
            create_alert(db, user.id, "weather", "Heat warning",
                         f"Current temperature {data['current']['temperature']} C in {data['location']} exceeds your limit of {p.max_temperature} C.")
        heavy = [d for d in data["forecast"] if d["rainfall"] >= 50]
        if heavy:
            create_alert(db, user.id, "weather", "Heavy rain forecast",
                         f"About {heavy[0]['rainfall']} mm of rain forecast on {heavy[0]['date']}. Check drainage and delay spraying.")
        db.commit()
    return data
