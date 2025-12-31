from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


# Therapist Models
class TherapistBase(BaseModel):
    clerk_user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    practice_type: Optional[str] = None  # therapy, training, tutoring, freelance


class TherapistUpdate(BaseModel):
    practice_type: Optional[str] = None


class Therapist(TherapistBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# Client Models
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

    # Free-text notes
    notes: Optional[str] = None  # Main session notes (free-text)
    summary: Optional[str] = None  # Quick summary for reference

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
    notes: Optional[str] = None
    summary: Optional[str] = None
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


# Todo Models
class TodoBase(BaseModel):
    client_id: int
    text: str
    status: str = "open"  # open, completed, dropped
    source_session_id: Optional[int] = None
    completed_session_id: Optional[int] = None


class TodoCreate(BaseModel):
    text: str
    client_id: int
    source_session_id: Optional[int] = None


class TodoUpdate(BaseModel):
    text: Optional[str] = None
    status: Optional[str] = None
    completed_session_id: Optional[int] = None


class Todo(TodoBase):
    id: int
    therapist_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
