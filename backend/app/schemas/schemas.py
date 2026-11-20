import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def _check_email(v: str) -> str:
    v = v.strip().lower()
    if not EMAIL_RE.match(v) or len(v) > 255:
        raise ValueError("Enter a valid email address")
    return v


def _check_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if len(v) > 64 or len(v.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 64 characters (72 bytes)")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("Password must contain at least one letter and one number")
    return v


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str
    password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def v_email(cls, v):
        return _check_email(v)

    @field_validator("password")
    @classmethod
    def v_pw(cls, v):
        return _check_password(v)

    @model_validator(mode="after")
    def match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginIn(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False

    @field_validator("email")
    @classmethod
    def v_email(cls, v):
        return _check_email(v)


class ForgotIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def v_email(cls, v):
        return _check_email(v)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def v_pw(cls, v):
        return _check_password(v)

    @model_validator(mode="after")
    def match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("New passwords do not match")
        return self


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class MonitoringIn(BaseModel):
    farm_name: str = Field(default="My Farm", min_length=1, max_length=100)
    nitrogen: float = Field(ge=0, le=300)
    phosphorus: float = Field(ge=0, le=300)
    potassium: float = Field(ge=0, le=300)
    ph: float = Field(ge=0, le=14)
    soil_moisture: float = Field(ge=0, le=100)
    temperature: float = Field(ge=-10, le=60)
    humidity: float = Field(ge=0, le=100)
    rainfall: float = Field(ge=0, le=1000)
    is_simulated: bool = False


class MonitoringOut(MonitoringIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: str
    recorded_at: datetime


class RecommendIn(BaseModel):
    nitrogen: float = Field(ge=0, le=300)
    phosphorus: float = Field(ge=0, le=300)
    potassium: float = Field(ge=0, le=300)
    temperature: float = Field(ge=-10, le=60)
    humidity: float = Field(ge=0, le=100)
    ph: float = Field(ge=0, le=14)
    rainfall: float = Field(ge=0, le=1000)


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    message: str
    severity: str
    category: str
    is_read: bool
    created_at: datetime


class ProfileOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    phone: Optional[str] = None
    location: Optional[str] = None
    farm_name: Optional[str] = None
    farm_size_acres: Optional[float] = None
    bio: Optional[str] = None
    min_soil_moisture: float
    max_temperature: float
    min_ph: float
    max_ph: float


class ProfileIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=30)
    location: Optional[str] = Field(default=None, max_length=120)
    farm_name: Optional[str] = Field(default=None, max_length=100)
    farm_size_acres: Optional[float] = Field(default=None, ge=0, le=1_000_000)
    bio: Optional[str] = Field(default=None, max_length=1000)
    min_soil_moisture: float = Field(default=20, ge=0, le=100)
    max_temperature: float = Field(default=38, ge=-10, le=60)
    min_ph: float = Field(default=5.5, ge=0, le=14)
    max_ph: float = Field(default=7.5, ge=0, le=14)

    @model_validator(mode="after")
    def ph_order(self):
        if self.min_ph >= self.max_ph:
            raise ValueError("Minimum pH must be lower than maximum pH")
        return self
