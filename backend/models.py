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

    # AI-assisted session data (JSON string)
    ai_assisted_data: Optional[str] = None  # JSON: emotions, lifeDomains, interventions, clarifyingQuestions, transcript, etc.

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
    ai_assisted_data: Optional[str] = None
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


# Intake System Models
class FormLinkCreate(BaseModel):
    client_email: str
    client_name: Optional[str] = None
    form_type: str  # therapy, training, tutoring, freelance
    included_assessments: list = []  # ['big-five', 'phq-9', etc.]
    expires_in_days: int = 7
    custom_message: Optional[str] = None


class FormLink(BaseModel):
    id: int
    therapist_id: int
    client_email: str
    client_name: Optional[str]
    link_token: str
    form_type: str
    included_assessments: str  # JSON string
    status: str  # sent, opened, completed
    expires_at: str
    sent_at: Optional[str]
    opened_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class IntakeResponseBase(BaseModel):
    form_type: str
    responses: dict  # JSON object with field responses
    status: str = "pending"


class IntakeResponseCreate(IntakeResponseBase):
    link_token: str


class IntakeResponseUpdate(BaseModel):
    responses: Optional[dict] = None
    status: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class IntakeResponse(BaseModel):
    id: int
    client_id: Optional[int]
    therapist_id: int
    form_type: str
    responses: str  # JSON string
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    reviewed_at: Optional[str]
    link_token: str
    expires_at: str
    created_at: str

    class Config:
        from_attributes = True


class AssessmentResponseCreate(BaseModel):
    link_token: str
    assessment_id: str
    responses: dict  # Question ID -> answer value


class AssessmentResponse(BaseModel):
    id: int
    client_id: Optional[int]
    therapist_id: int
    intake_response_id: Optional[int]
    assessment_id: str
    responses: str  # JSON string
    scores: str  # JSON string
    completed_at: str
    created_at: str

    class Config:
        from_attributes = True


class IntakeWithAssessments(IntakeResponse):
    """Intake response with embedded assessment results"""
    assessments: list = []  # List of AssessmentResponse objects


# Message Models (bidirectional correspondence)
class MessageBase(BaseModel):
    sender_id: int
    sender_type: str  # 'therapist' or 'client'
    recipient_id: int
    recipient_type: str  # 'therapist' or 'client'
    content: str
    attachments: Optional[list] = []  # List of attachment objects
    related_session_id: Optional[int] = None


class MessageCreate(BaseModel):
    recipient_id: int
    recipient_type: str
    content: str
    attachments: Optional[list] = []
    related_session_id: Optional[int] = None


class MessageUpdate(BaseModel):
    read: Optional[bool] = None
    read_at: Optional[str] = None


class Message(MessageBase):
    id: int
    read: bool
    read_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# Homework Assignment Models
class HomeworkAssignmentBase(BaseModel):
    client_id: int
    title: str
    instructions: str
    attachments: Optional[list] = []  # List of attachment objects
    due_date: Optional[str] = None  # Format: YYYY-MM-DD
    session_id: Optional[int] = None


class HomeworkAssignmentCreate(BaseModel):
    client_id: int
    title: str
    instructions: str
    attachments: Optional[list] = []
    due_date: Optional[str] = None
    session_id: Optional[int] = None


class HomeworkAssignmentUpdate(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    attachments: Optional[list] = None
    due_date: Optional[str] = None
    status: Optional[str] = None  # assigned, submitted, reviewed, completed


class HomeworkAssignment(HomeworkAssignmentBase):
    id: int
    therapist_id: int
    status: str
    created_at: str

    class Config:
        from_attributes = True


# Homework Submission Models
class HomeworkSubmissionBase(BaseModel):
    assignment_id: int
    content: str
    attachments: Optional[list] = []


class HomeworkSubmissionCreate(HomeworkSubmissionBase):
    pass


class HomeworkSubmissionUpdate(BaseModel):
    therapist_feedback: Optional[str] = None
    feedback_at: Optional[str] = None


class HomeworkSubmission(HomeworkSubmissionBase):
    id: int
    client_id: int
    submitted_at: str
    therapist_feedback: Optional[str]
    feedback_at: Optional[str]

    class Config:
        from_attributes = True


class HomeworkAssignmentWithSubmission(HomeworkAssignment):
    """Homework assignment with embedded submission if exists"""
    submission: Optional[HomeworkSubmission] = None
