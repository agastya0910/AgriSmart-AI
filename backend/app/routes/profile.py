from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, UserProfile
from app.schemas.schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["Profile"])


def _out(user: User) -> dict:
    p = user.profile
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "created_at": user.created_at,
            "phone": p.phone, "location": p.location, "farm_name": p.farm_name, "farm_size_acres": p.farm_size_acres,
            "bio": p.bio, "min_soil_moisture": p.min_soil_moisture, "max_temperature": p.max_temperature,
            "min_ph": p.min_ph, "max_ph": p.max_ph}


def _ensure(user: User, db: Session):
    if user.profile is None:
        user.profile = UserProfile()
        db.commit()
        db.refresh(user)


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure(user, db)
    return _out(user)


@router.put("", response_model=ProfileOut)
def update_profile(data: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure(user, db)
    user.full_name = data.full_name.strip()
    for k, v in data.model_dump(exclude={"full_name"}).items():
        setattr(user.profile, k, v)
    db.commit()
    db.refresh(user)
    return _out(user)
