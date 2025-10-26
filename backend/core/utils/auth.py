from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from dal.models.user import User
from dal.models.annotator import Annotator
from dal.setup import get_db

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, user_type: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    data = {
        "sub": str(user_id),
        "type": user_type,
        "exp": expire,
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Get current authenticated user from token"""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    user_id_str = payload.get("sub")
    user_type = payload.get("type")

    if not user_id_str or not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Converter de volta para int
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token"
        )

    if user_type == "admin":
        user = db.query(User).filter(User.id == user_id).first()
    elif user_type == "annotator":
        user = db.query(Annotator).filter(Annotator.id == user_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user type"
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {"user": user, "type": user_type}


def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin authentication"""
    if current_user["type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user["user"]


def require_annotator(current_user: dict = Depends(get_current_user)):
    """Dependency to require annotator authentication"""
    if current_user["type"] != "annotator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Annotator access required"
        )
    return current_user["user"]
