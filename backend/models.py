from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import Optional
import re
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


# Iter 92.24 (Mert): phone-OR-email login. Helpers to normalize/detect identifier.
def normalize_phone(v: str | None) -> str | None:
    """Strip whitespace, dashes, parens, dots, slashes. Preserve leading '+'.
    Returns canonical E.164-ish string ('+491701234567') or None when input
    is empty/None. Does NOT validate country code — that's loose by design so
    legacy German users can enter '0170…' or '+49170…'.
    """
    if v is None:
        return None
    v = str(v).strip()
    if not v:
        return None
    has_plus = v.startswith("+")
    digits = re.sub(r"[^\d]", "", v)
    if not digits:
        return None
    return ("+" + digits) if has_plus else digits


def looks_like_phone(v: str) -> bool:
    """True when the identifier looks like a phone number (starts with '+',
    or is mostly digits with no '@'). Used to route login lookup."""
    if not v:
        return False
    if "@" in v:
        return False
    if v.startswith("+"):
        return True
    digits = re.sub(r"[^\d]", "", v)
    # Mostly digits + at least 5 of them = phone candidate
    return len(digits) >= 5 and (len(digits) / max(len(v), 1)) >= 0.6


class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    # Iter 92.34 (Mert Go-Live Checklist §10): phone now REQUIRED at signup.
    # Used for Cal.com coaching confirmations + as a secondary login identifier
    # (Iter 92.24 phone-OR-email login). Required = friction trade-off accepted
    # for higher data quality + Cal.com pipeline reliability.
    phone: str

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
    def _validate_phone(cls, v: str) -> str:
        # Iter 92.34: phone is now MANDATORY — empty/null no longer allowed.
        if v is None:
            raise ValueError("Telefonnummer ist erforderlich")
        v = str(v).strip()
        if not v:
            raise ValueError("Telefonnummer ist erforderlich")
        if len(v) < 5 or len(v) > 32:
            raise ValueError("Telefonnummer muss zwischen 5 und 32 Zeichen lang sein")
        import re
        if not re.match(r"^[+()\d\s\-./]+$", v):
            raise ValueError("Telefonnummer enthält ungültige Zeichen")
        return v


class UserLogin(BaseModel):
    # Iter 92.24 (Mert): accept EITHER email OR phone as login identifier.
    # `identifier` is the canonical field; `email` kept for backwards-compat
    # (old frontend builds still POST {email, password}). At least one must be set.
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

    @model_validator(mode="after")
    def _ensure_identifier(self):
        # Coalesce email/phone into identifier so handlers only read one field.
        # Priority: explicit `identifier` > `phone` > `email`.
        if not self.identifier:
            self.identifier = self.phone or self.email or ""
        self.identifier = (self.identifier or "").strip()
        if not self.identifier:
            raise ValueError("E-Mail oder Telefonnummer ist erforderlich")
        return self


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
    # Iter 92.42 (Mert · Vibe-Security): client-declared input modality so the
    # backend can stamp every chat response with what the user actually used.
    # 'text' (default), 'speech' (audio transcribed via Whisper), 'video'
    # (clip transcribed + SEXIER-analysed). Server still re-validates.
    modality: Optional[str] = "text"


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
    counterpart_style: Optional[str] = None
    training_goal: Optional[str] = None


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
