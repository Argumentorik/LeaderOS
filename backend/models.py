from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str  # Required for high-ticket follow-up & SMS reminders
    role: str
    custom_role: Optional[str] = None
    consent_privacy: bool = True
    consent_marketing: bool = False


class QuizAnswer(BaseModel):
    question_id: Union[str, int]
    category: str
    layer: str
    score: int


class ChatTurn(BaseModel):
    role: str
    text: str


class QuizSubmit(BaseModel):
    session_id: str
    answers: List[QuizAnswer]
    chat_context: Optional[List[ChatTurn]] = None
    journal_entries: Optional[List[str]] = None


class CoachMessage(BaseModel):
    session_id: str
    message: str


class EmailSend(BaseModel):
    session_id: str


class LicenseKeyActivate(BaseModel):
    license_key: str
    email: Optional[str] = None


class LicenseKeyCreate(BaseModel):
    plan: str
    email: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[str] = None


class BookingRequest(BaseModel):
    date: str
    time: str
    name: Optional[str] = None
    email: Optional[str] = None
    session_id: Optional[str] = None
    plan: Optional[str] = "leader_os_plus"
    notes: Optional[str] = None


class EnterpriseInquiry(BaseModel):
    company: str
    contact_name: str
    email: EmailStr
    employee_count: int
    phone: Optional[str] = None
    message: Optional[str] = None
    include_coaching: Optional[bool] = False


class AuthSession(BaseModel):
    session_id: str


class CreateCheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    email: Optional[str] = None
    user_name: Optional[str] = None
    user_session_id: Optional[str] = None
