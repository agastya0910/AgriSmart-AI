from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, User
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _own(db, user, nid) -> Notification:
    n = db.query(Notification).filter(Notification.id == nid, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    return n


@router.get("", response_model=list[NotificationOut])
def list_notifications(unread_only: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    return q.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(300).all()


@router.patch("/read-all")
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"updated": n}


@router.patch("/{nid}/read", response_model=NotificationOut)
def mark_read(nid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, nid)
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.delete("/{nid}", status_code=204)
def delete_notification(nid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_own(db, user, nid))
    db.commit()
