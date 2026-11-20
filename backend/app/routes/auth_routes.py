import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User, UserProfile
from app.schemas.schemas import ChangePasswordIn, ForgotIn, LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Very small in-memory brute-force throttle (per email). Use Redis / a proper limiter in production.
_FAILS: dict[str, list[float]] = {}
MAX_FAILS, WINDOW = 5, 300


def _throttled(email: str) -> bool:
    now = time.time()
    _FAILS[email] = [t for t in _FAILS.get(email, []) if now - t < WINDOW]
    return len(_FAILS[email]) >= MAX_FAILS


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    user = User(email=data.email, full_name=data.full_name.strip(), hashed_password=hash_password(data.password))
    user.profile = UserProfile()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    if _throttled(data.email):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many failed attempts. Try again in a few minutes.")
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        _FAILS.setdefault(data.email, []).append(time.time())
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    _FAILS.pop(data.email, None)
    token, expires = create_access_token(user.id, data.remember)
    return TokenOut(access_token=token, expires_in=expires, user=user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password")
def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if verify_password(data.new_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "New password must differ from the current password")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotIn):
    # Email delivery (SMTP) is not configured in this project, so no reset email can be sent.
    # The response is identical for existing and unknown emails to avoid account enumeration.
    return {
        "message": "Password recovery by email is not configured in this installation, so no email was sent. "
                   "If you are signed in, use Settings > Change password. Otherwise ask the administrator to "
                   "reset your password or configure SMTP and a reset-token flow.",
        "email_configured": False,
    }
