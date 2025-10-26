from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class AnnotatorInGroup(BaseModel):
    id: int
    name: str
    email: str


class GroupWithMembers(BaseModel):
    id: int
    name: str
    members: list[AnnotatorInGroup]


class AddMemberRequest(BaseModel):
    annotator_id: int


class AnnotatorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    type: str


class AnnotatorResponse(BaseModel):
    id: int
    name: str
    email: str
    type: Optional[str] = "annotator"


class AnnotationCreate(BaseModel):
    image_id: int
    tag_names: list[str]


class ImageResponse(BaseModel):
    id: int
    name: str
    url: str
    tags: list[str]
    is_classified: bool
    classified_at: Optional[datetime]
    date_added: datetime


class AITagSuggestion(BaseModel):
    suggestions: list[str]


class LoginData(BaseModel):
    email: EmailStr
    password: str


class LoginAnnotatorData(BaseModel):
    email: EmailStr


class RegisterAdmin(BaseModel):
    email: EmailStr
    password: str


class RegisterAnnotator(BaseModel):
    name: str
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    email: str
    type: str
