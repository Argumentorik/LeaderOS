from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from email_validator import validate_email, EmailNotValidError


def _normalize_email(v: str) -> str:
    """Validate email format. Uses `test_environment=True` so reserved dev TLDs
    (.test, .example, .invalid, .localhost per RFC 2606) are accepted.
    Returns the normalized (lowercased) email."""
    if not isinstance(v, str):
        raise ValueError("Email must be a string")
    v = v.strip()
    try:
        result = validate_email(
            v,
            check_deliverability=False,
            test_environment=True,
        )
    except EmailNotValidError as e:
        raise ValueError(str(e))
    return result.normalized


class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    # Iter 92.23.12 (Mert): optional phone collected at signup for Cal.com
    # coaching call confirmations. NOT used for auth — login remains email-only.
    phone: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, v: str) -> str:
        if not v or len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Name is required")
        if len(v) > 100:
            raise ValueError("Name too long")
        return v

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v):
        # Optional: empty/null is fine. When provided, sanity-check:
        #   - strip whitespace
        #   - allow + digits spaces hyphens parens slash dots, common in DE/EU/US
        #   - 5..32 chars after strip — too short = junk, too long = spam
        if v is None:
            return None
        v = str(v).strip()
        if not v:
            return None
        if len(v) < 5 or len(v) > 32:
            raise ValueError("Telefonnummer muss zwischen 5 und 32 Zeichen lang sein")
        # very loose phone regex — just enough to reject obvious garbage
        import re
        if not re.match(r"^[+()\d\s\-./]+$", v):
            raise ValueError("Telefonnummer enthält ungültige Zeichen")
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: str) -> str:
        # Login: lenient — just lowercase+strip, no strict format check,
        # so legacy accounts with unusual formats aren't locked out.
        return (v or "").strip().lower()


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    leadership_score: int = 0
    eq_score: int = 0
    communication_score: int = 0
    level: str = "Emerging Leader"
    xp: int = 0
    created_at: Optional[str] = None


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    agent: Optional[str] = None
    # Iter 92.23.8 (Mert): when a chat is started from inside a folder, the
    # frontend forwards the folder_id so the backend can prepend the folder's
    # context_summary to the system prompt — "agent always next to you".
    folder_id: Optional[str] = None


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    agent: Optional[str] = None
    folder_id: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class SimulationStart(BaseModel):
    scenario: str
    difficulty: Optional[str] = "medium"


class SimulationMessage(BaseModel):
    message: str


class PlaybookStart(BaseModel):
    playbook_id: str


class PlaybookStepIn(BaseModel):
    step_index: int
    user_input: str


class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str
    date: str
    duration: Optional[str] = "60 min"
    max_participants: Optional[int] = 50


class DailyCheckinIn(BaseModel):
    content: str
    checkin_type: Optional[str] = "text"
