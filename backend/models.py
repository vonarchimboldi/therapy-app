from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class ClientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str  # Format: YYYY-MM-DD
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    status: str = "active"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    status: Optional[str] = None


class Client(ClientBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class SessionBase(BaseModel):
    client_id: int
    session_date: str  # Format: YYYY-MM-DD
    session_time: Optional[str] = None  # Format: HH:MM (24-hour)
    duration_minutes: int
    status: str = "completed"  # scheduled, completed, cancelled, no-show

    # Structured data - rich text notes
    life_domains: dict = {}  # {"relationships": "detailed notes...", "career": "notes...", ...}
    emotional_themes: dict = {}  # {"anxiety": "detailed notes...", "anger": "notes...", ...}
    interventions: list = []  # ["CBT", "mindfulness", ...]

    # Clinical fields
    overall_progress: Optional[str] = None  # "improving", "stable", "declining"
    session_summary: Optional[str] = None
    client_insights: Optional[str] = None
    homework_assigned: Optional[str] = None
    clinical_observations: Optional[str] = None
    risk_assessment: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    session_date: Optional[str] = None
    session_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    life_domains: Optional[dict] = None
    emotional_themes: Optional[dict] = None
    interventions: Optional[list] = None
    overall_progress: Optional[str] = None
    session_summary: Optional[str] = None
    client_insights: Optional[str] = None
    homework_assigned: Optional[str] = None
    clinical_observations: Optional[str] = None
    risk_assessment: Optional[str] = None


class Session(SessionBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class SessionWithClient(Session):
    """Session with embedded client info for Today view"""
    first_name: str
    last_name: str
