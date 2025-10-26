from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.schemas.api import (
    AnnotatorResponse,
    ChangePassword,
    LoginData,
    RegisterAdmin,
    AnnotatorCreate,
    TokenResponse,
    UserResponse,
)
from dal.models.user import User
from dal.models.annotator import Annotator
from core.utils.auth import (
    ALGORITHM,
    SECRET_KEY,
    decode_token,
    get_current_user,
    hash_password,
    require_annotator,
    verify_password,
    create_token,
)
from dal.setup import get_db

router = APIRouter()


# Admin Routes
@router.post("/admin/login", response_model=TokenResponse)
def admin_login(data: LoginData, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id, "admin")
    return TokenResponse(token=token, type="admin")


@router.post("/admin/register", response_model=TokenResponse)
def admin_register(data: RegisterAdmin, db: Session = Depends(get_db)):
    """Admin registration endpoint"""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = User(email=data.email, password_hash=hash_password(data.password[:72]))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, "admin")
    return TokenResponse(token=token, type="admin")


# Annotator Routes
@router.post("/annotator/login", response_model=TokenResponse)
def annotator_login(data: LoginData, db: Session = Depends(get_db)):
    """Annotator login endpoint"""
    annotator = db.query(Annotator).filter(Annotator.email == data.email).first()
    print(annotator.password_hash)
    print(data)
    if not annotator or not verify_password(data.password, annotator.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(annotator.id, "annotator")
    return TokenResponse(token=token, type="annotator")


@router.post("/annotator/register", response_model=TokenResponse)
def annotator_register(data: AnnotatorCreate, db: Session = Depends(get_db)):
    """Annotator registration endpoint"""
    existing = db.query(Annotator).filter(Annotator.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    annotator = Annotator(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password[:72]),
    )
    db.add(annotator)
    db.commit()
    db.refresh(annotator)

    token = create_token(annotator.id, "annotator")
    return TokenResponse(token=token, type="annotator")


@router.post("/annotator/change-password")
def change_annotator_password(
    data: ChangePassword,
    annotator: Annotator = Depends(require_annotator),
    db: Session = Depends(get_db),
):
    """Change annotator password endpoint"""
    if not verify_password(data.old_password, annotator.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    annotator.password_hash = hash_password(data.new_password[:72])
    db.commit()

    return {"ok": True, "message": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user = current_user["user"]
    user_type = current_user["type"]

    if user_type == "admin":
        return UserResponse(id=user.id, email=user.email, type="admin")
    else:
        return AnnotatorResponse(
            id=user.id, name=user.name, email=user.email, type="annotator"
        )
